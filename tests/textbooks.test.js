import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/index.js';
import { groundedFallback, loadTextbooks, normalize, retrieve, retrieveChapterSummary } from '../server/textbooks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = await loadTextbooks(root);

test('both supplied TXT textbooks are indexed with chapter and section context', () => {
  assert.ok(corpus.length > 0, 'Expected at least one readable textbook passage');
  const files = new Set(corpus.map((chunk) => chunk.file));
  assert.ok(files.has('1.GIaoTrinh_CNXHKH_Tr01_Tr66.txt'));
  assert.ok(files.has('2.GiaoTrinh_CNXHKH_Tr67_Tr144.txt'));
  assert.ok(corpus.some((chunk) => chunk.file === '2.GiaoTrinh_CNXHKH_Tr67_Tr144.txt' && chunk.text.length > 500));
  const definition = retrieve('Giai cấp công nhân là ai?', corpus);
  assert.ok(definition.length > 0, 'The textbook definition should be retrievable');
  assert.ok(definition.some((chunk) => normalize(chunk.text).includes('khai niem giai cap cong nhan')));
  assert.ok(definition[0].chapter.toLowerCase().includes('chương 2'));
  assert.equal(definition[0].page, 30, 'OCR pages should cite the printed page number');
});

test('retrieval understands a plain student question and rejects an unrelated topic', () => {
  const answers = retrieve('Giai cấp công nhân là ai?', corpus);
  assert.ok(answers[0].text.toLowerCase().includes('giai cấp công nhân'));
  assert.deepEqual(retrieve('Hướng dẫn làm bánh chocolate bằng lò vi sóng', corpus), []);
});

test('a question about the dimensions of the historical mission retrieves the matching section', () => {
  const answers = retrieve('Sứ mệnh lịch sử của giai cấp công nhân là gì?', corpus);
  assert.ok(answers.length > 0);
  assert.ok(answers[0].section.includes('Nội dung sứ mệnh lịch sử'));
  assert.ok(answers.some((chunk) => (
    chunk.section.includes('Nội dung sứ mệnh lịch sử')
    && normalize(chunk.text).includes('ba noi dung co ban')
  )));
  assert.ok(answers.every((chunk) => !normalize(chunk.section).includes('viet nam hien nay')));
});

test('retrieval handles student paraphrases of the mission and chapter-summary requests', () => {
  const mission = retrieve('Sứ mạng lịch sử của giai cấp công nhân gồm những nội dung nào?', corpus);
  assert.ok(mission.length > 0);
  assert.ok(mission.some((chunk) => chunk.section.includes('Nội dung sứ mệnh lịch sử')));
  assert.ok(mission.every((chunk) => !chunk.section.includes('khái niệm giai cấp công nhân')));

  const summary = retrieve('Chương 2 nói về gì?', corpus);
  assert.ok(summary.length >= 6);
  assert.ok(summary.some((chunk) => chunk.section.startsWith('1.2.')));
  assert.ok(summary.some((chunk) => chunk.section.startsWith('3.3.2.')));
});

test('short course questions retrieve their own Ch. 4, Ch. 6 and Ch. 7 concepts', () => {
  const cases = [
    ['Dân chủ là gì?', '1.1.1. Quan niệm về dân chủ', 'Chương 4'],
    ['Dân tộc là gì?', '1.1. Khái niệm, đặc trưng cơ bản của dân tộc', 'Chương 6'],
    ['Tôn giáo có nguồn gốc thế nào?', '2.1.1. Bản chất, nguồn gốc và tính chất của tôn giáo', 'Chương 6'],
    ['Gia đình có những chức năng nào?', '1.3. Chức năng cơ bản của gia đình', 'Chương 7'],
  ];
  for (const [question, section, chapter] of cases) {
    const matches = retrieve(question, corpus, 4);
    assert.ok(matches.some((match) => match.section.startsWith(section)), question);
    assert.ok(matches.every((match) => match.chapter === chapter), question);
  }
});

test('a sourced factory-role question retrieves Chapter 2 theory instead of unrelated high-frequency passages', () => {
  const answers = retrieve('Giai cấp công nhân đóng góp và có thể phát huy vai trò thế nào trong Nhà máy Đạm Cà Mau? Hãy bám sát Chương 2 giáo trình MLN131.', corpus, 8);
  assert.ok(answers.length > 0);
  assert.ok(answers.every((chunk) => chunk.chapter === 'Chương 2'));
  assert.ok(answers.some((chunk) => chunk.section.startsWith('1.2. Nội dung sứ mệnh lịch sử')));
  assert.ok(answers.some((chunk) => chunk.section.startsWith('3.3.2. Một số giải pháp')));
});

test('a broad Chapter 2 summary samples the main sections instead of retrieving bibliography noise', () => {
  const answers = retrieveChapterSummary('Tóm tắt nội dung chương 2', corpus);
  const sections = answers.map((chunk) => chunk.section);
  assert.ok(sections.some((section) => section.startsWith('1.1.')));
  assert.ok(sections.some((section) => section.startsWith('1.2.')));
  assert.ok(sections.some((section) => section.startsWith('2.2.1.')));
  assert.ok(sections.some((section) => section.startsWith('3.3.2.')));
  assert.ok(!sections.some((section) => /tài liệu tham khảo|câu hỏi ôn tập/i.test(section)));
  assert.ok(sections.every((section, index) => !answers[index].summaryExcluded));
});

test('chapter summaries cover every requested chapter and never borrow Chapter 1 citations', () => {
  for (let number = 1; number <= 7; number += 1) {
    const question = 'Tóm tắt nội dung Chương ' + number;
    const matches = retrieve(question, corpus);
    assert.ok(matches.length >= 2, question + ' should retrieve several sections');
    assert.ok(matches.every((chunk) => normalize(chunk.chapter) === normalize('Chương ' + number)), question);
    assert.ok(new Set(matches.map((chunk) => normalize(chunk.section))).size >= 2, question + ' should cover distinct sections');
  }
});

test('chapter detection accepts Vietnamese ordinals and Roman numerals, and supports a requested pair', () => {
  const fourth = retrieveChapterSummary('Tóm lược Chương thứ tư', corpus);
  assert.ok(fourth.length >= 2);
  assert.ok(fourth.every((chunk) => normalize(chunk.chapter) === 'chuong 4'));

  const sixth = retrieveChapterSummary('Khái quát Chapter VI', corpus);
  assert.ok(sixth.length >= 2);
  assert.ok(sixth.every((chunk) => normalize(chunk.chapter) === 'chuong 6'));

  const fifthSections = retrieveChapterSummary('Tóm tắt Chương 5', corpus).map((chunk) => chunk.section);
  assert.ok(fifthSections.some((section) => section.startsWith('1.1.2.')), 'OCR restores the lost separator in nested section numbers');

  const pair = retrieveChapterSummary('Tóm tắt Chương 3 và Chương 4', corpus);
  assert.ok(pair.some((chunk) => normalize(chunk.chapter) === 'chuong 3'));
  assert.ok(pair.some((chunk) => normalize(chunk.chapter) === 'chuong 4'));
  assert.ok(pair.every((chunk) => ['chuong 3', 'chuong 4'].includes(normalize(chunk.chapter))));

  for (const question of ['Tóm tắt Chương 1-3', 'Tóm tắt Chương 2 đến 4', 'Tóm tắt Chương 2 và 3']) {
    assert.deepEqual(retrieve(question, corpus), [], question + ' should not silently summarize only the first number');
  }
});

test('offline chapter summary fallback stays within the requested chapter', () => {
  const question = 'Tóm tắt Chương 5';
  const matches = retrieve(question, corpus);
  const answer = groundedFallback(question, matches);
  assert.match(answer, /Tóm tắt theo các mục/);
  assert.match(answer, /Chương 5/);
  assert.doesNotMatch(answer, /Chương 1\n/);
  assert.ok(matches.every((chunk) => normalize(chunk.chapter) === 'chuong 5'));
});

test('chat refuses to replace an unavailable requested chapter with a different chapter', async () => {
  const withoutChapterThree = corpus.filter((chunk) => normalize(chunk.chapter) !== 'chuong 3');
  let geminiCalls = 0;
  await withServer({
    corpus: withoutChapterThree,
    apiKeys: ['test-key'],
    fetchImpl: async () => { geminiCalls += 1; throw new Error('Gemini should not be called for a missing summary chapter'); },
  }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tóm tắt Chương 3' }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.grounded, false);
    assert.deepEqual(data.sources, []);
    assert.match(data.answer, /không lấy Chương 1 hay chương khác để thay thế/);
  });
  assert.equal(geminiCalls, 0);
});

test('a new explicit chapter summary overrides an older chapter in conversation history', async () => {
  await withServer({ corpus, apiKeys: [] }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tóm tắt Chương 5',
        history: [{ role: 'user', text: 'Giải thích khái niệm giai cấp công nhân trong Chương 2.' }],
      }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.ok(data.sources.length > 0);
    assert.ok(data.sources.every((source) => normalize(source.chapter) === 'chuong 5'));
  });
});

test('an unspecified remaining-chapters summary asks for scope instead of guessing from history', async () => {
  let geminiCalls = 0;
  await withServer({
    corpus,
    apiKeys: ['test-key'],
    fetchImpl: async () => { geminiCalls += 1; throw new Error('Gemini should not be called for an ambiguous chapter scope'); },
  }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tóm tắt các chương còn lại',
        history: [{ role: 'user', text: 'Tóm tắt Chương 2.' }],
      }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(data.sources, []);
    assert.match(data.answer, /Bạn muốn mình tóm tắt chương nào/);
  });
  assert.equal(geminiCalls, 0);
});

test('OCR page markers produce accurate printed page citations and chapter boundaries', () => {
  const mission = retrieve('Sứ mệnh lịch sử của giai cấp công nhân là gì?', corpus);
  assert.ok(mission.some((chunk) => chunk.page === 31 || chunk.page === 32));
  const chapterFour = retrieve('Tóm tắt Chương 4', corpus);
  assert.ok(chapterFour.some((chunk) => chunk.page === 67));
  assert.ok(chapterFour.every((chunk) => chunk.page >= 67 && chunk.page <= 87));
  assert.ok(!corpus.some((chunk) => normalize(chunk.chapter) === 'chuong 2' && chunk.page < 28), 'Repeated chapter names in the contents page are not chapter content');
});

test('offline mission answer responds to the mission question instead of the worker definition', () => {
  const matches = retrieve('Sứ mệnh lịch sử của giai cấp công nhân là gì?', corpus);
  const answer = groundedFallback('Sứ mệnh lịch sử của giai cấp công nhân là gì?', matches);
  assert.match(answer, /tổ chức và lãnh đạo nhân dân lao động/);
  assert.match(answer, /xóa bỏ chủ nghĩa tư bản/);
  assert.match(answer, /kinh tế; chính trị – xã hội; văn hóa – tư tưởng/);
  assert.match(answer, /1\.2\. Nội dung sứ mệnh lịch sử/);
  assert.doesNotMatch(answer, /nền công nghiệp hiện đại/);
});

test('offline mission fallback recognizes paraphrases and answers the three textbook dimensions', () => {
  const question = 'Sứ mạng lịch sử của giai cấp công nhân gồm những nội dung nào?';
  const answer = groundedFallback(question, retrieve(question, corpus));
  assert.match(answer, /xóa bỏ chủ nghĩa tư bản/);
  assert.match(answer, /kinh tế; chính trị – xã hội; văn hóa – tư tưởng/);
  assert.doesNotMatch(answer, /nền công nghiệp hiện đại/);
});

test('offline answer for the definition question is readable and grounded in the supplied book', () => {
  const matches = retrieve('Giai cấp công nhân là ai?', corpus);
  const answer = groundedFallback('Giai cấp công nhân là ai?', matches);
  assert.match(answer, /nền đại công nghiệp/);
  assert.match(answer, /Nguồn:/);
  assert.doesNotMatch(answer, /chưa tìm thấy đoạn giáo trình/i);
});

test('offline applied answer separates Chapter 2 theory, sourced plant facts, and analysis', async () => {
  const context = {
    location: 'Cà Mau',
    industry: 'Nhà máy Đạm Cà Mau',
    evidence: 'Báo Chính phủ ghi nhận mốc 11 triệu tấn urê lũy kế vào tháng 12/2024.',
    sources: [{
      publisher: 'Báo Điện tử Chính phủ · 2024',
      title: 'Nhà máy Đạm Cà Mau cán mốc sản lượng 11 triệu tấn UREA',
      url: 'https://baochinhphu.vn/nha-may-dam-ca-mau.htm',
    }],
  };
  await withServer({ corpus, apiKeys: [] }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Công nhân đóng góp và phát huy vai trò thế nào tại nhà máy?',
        context,
      }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.answer, /Theo giáo trình Chương 2/);
    assert.match(data.answer, /Dữ kiện thực tế có nguồn/);
    assert.match(data.answer, /Liên hệ:/);
    assert.match(data.answer, /không tự chứng minh năng suất/);
    assert.equal(data.dataSources.length, 1);
  });
});

async function withServer(options, callback) {
  const server = createApp(options).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  try {
    return await callback('http://127.0.0.1:' + address.port);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('chat API answers the historical mission question from the matching textbook section', async () => {
  await withServer({ corpus, apiKeys: [] }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Sứ mệnh lịch sử của giai cấp công nhân là gì?' }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.answer, /xóa bỏ chủ nghĩa tư bản/);
    assert.match(data.answer, /áp bức, bóc lột/);
    assert.match(data.answer, /kinh tế; chính trị – xã hội; văn hóa – tư tưởng/);
    assert.doesNotMatch(data.answer, /nền công nghiệp hiện đại/);
    assert.ok(data.sources.length >= 1 && data.sources.length <= 2);
    assert.ok(data.sources.some((source) => /^1\.2\. Nội dung sứ mệnh lịch sử/.test(source.section)));
  });
});

test('chat discovers supported Gemini models and tries the next model after failures', async () => {
  let callCount = 0;
  let requestBody;
  const mockFetch = async (url, options) => {
    callCount += 1;
    const target = String(url);
    if (target.includes('/v1beta/models?')) {
      const finalPage = target.includes('pageToken=next');
      return new Response(JSON.stringify({ models: [
        ...(finalPage ? [] : [
          { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
          { name: 'models/gemini-fast-a', baseModelId: 'gemini-fast-a', supportedGenerationMethods: ['generateContent'] },
        ]),
        ...(finalPage ? [{ name: 'models/gemini-fast-b', baseModelId: 'gemini-fast-b', supportedGenerationMethods: ['generateContent'] }] : []),
      ], ...(finalPage ? {} : { nextPageToken: 'next' }) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const modelId = target.match(/models\/([^/:]+):generateContent$/)?.[1];
    assert.ok(['gemini-fast-a', 'gemini-fast-b'].includes(modelId), target);
    if (modelId === 'gemini-fast-a') {
      return new Response(JSON.stringify({ error: { message: 'temporary model failure' } }), { status: 503 });
    }
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Theo Chương 2, giai cấp công nhân gắn với nền công nghiệp hiện đại.' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  await withServer({
    corpus,
    apiKeys: ['test-key-one', 'test-key-two', 'test-key-three'],
    fetchImpl: mockFetch,
  }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Giai cấp công nhân là ai?',
      history: [{ role: 'user', text: 'Mình đang học Chương 2.' }],
    }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.answer, /nền công nghiệp hiện đại/);
    assert.ok(data.sources.length > 0);
    assert.equal(data.model, 'gemini-fast-b');
  });

  assert.equal(callCount, 4, 'the paged model list is read once, then only the first supported model and one backup are called');
  assert.match(requestBody.contents[0].parts[0].text, /Mình đang học Chương 2/);
  assert.match(requestBody.system_instruction.parts[0].text, /không có đoạn phù hợp/);
  assert.equal(requestBody.generationConfig.thinkingConfig.thinkingLevel, 'low');
  assert.equal(requestBody.generationConfig.maxOutputTokens, 850);
});

test('an unrelated question can use Gemini but does not inherit map facts or citations', async () => {
  let generationRequest;
  const mockFetch = async (url, options) => {
    if (String(url).includes('/v1beta/models?')) {
      return new Response(JSON.stringify({ models: [
        { name: 'models/gemini-fast-a', supportedGenerationMethods: ['generateContent'] },
      ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    generationRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Mình có thể giải thích câu hỏi này theo kiến thức chung. Phần hiện có chưa khớp trực tiếp với đoạn nào trong giáo trình.' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const context = {
    location: 'Cà Mau',
    industry: 'Nhà máy Đạm Cà Mau',
    evidence: 'Bài báo ghi nhận mốc 11 triệu tấn urê lũy kế vào tháng 12/2024.',
    sources: [{
      publisher: 'Báo Điện tử Chính phủ · 2024',
      title: 'Nhà máy Đạm Cà Mau cán mốc sản lượng 11 triệu tấn UREA',
      url: 'https://baochinhphu.vn/nha-may-dam-ca-mau.htm',
    }],
  };
  await withServer({ corpus, apiKeys: ['test-key-one'], fetchImpl: mockFetch }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hướng dẫn làm bánh chocolate bằng lò vi sóng?',
        history: [{ role: 'assistant', text: 'Chào bạn, mình đang nghe đây.' }],
        context,
      }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.grounded, false);
    assert.deepEqual(data.dataSources, []);
    assert.deepEqual(data.sources, []);
    assert.equal(data.textbookChecked, false);
    assert.match(generationRequest.contents[0].parts[0].text, /Chào bạn, mình đang nghe đây/);
    assert.doesNotMatch(generationRequest.contents[0].parts[0].text, /mốc 11 triệu tấn urê lũy kế/);
    assert.doesNotMatch(generationRequest.contents[0].parts[0].text, /baochinhphu\.vn/);
    assert.match(generationRequest.contents[0].parts[0].text, /Không tìm thấy đoạn đủ liên quan/);
  });
});

test('if every discovered Gemini model fails, the chat returns a textbook-based answer', async () => {
  let callCount = 0;
  await withServer({
    corpus,
    apiKeys: ['test-key-one', 'test-key-two', 'test-key-three'],
    fetchImpl: async (url) => {
      callCount += 1;
      if (String(url).includes('/v1beta/models?')) {
        return new Response(JSON.stringify({ models: [
          { name: 'models/gemini-fast-a', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/gemini-fast-b', supportedGenerationMethods: ['generateContent'] },
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: { message: 'test failure' } }), { status: 503 });
    },
  }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Giai cấp công nhân là ai?' }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.fallback, true);
    assert.match(data.answer, /nền đại công nghiệp/);
    assert.ok(data.sources.length > 0);
  });
  assert.equal(callCount, 3, 'the model list is fetched once and no more than two bounded generation attempts are made');
});

test('chat noise and rude feedback never trigger Gemini, textbook citations, or map facts', async () => {
  let geminiCalls = 0;
  const context = {
    location: 'Cà Mau', industry: 'Nhà máy Đạm Cà Mau', evidence: 'Bài báo ghi nhận mốc sản lượng.',
    sources: [{ publisher: 'Báo Chính phủ', title: 'Mốc sản lượng', url: 'https://baochinhphu.vn/example' }],
  };
  await withServer({ corpus, apiKeys: ['test-key'], fetchImpl: async () => { geminiCalls += 1; throw new Error('should short circuit'); } }, async (base) => {
    for (const message of ['kkkk', 'mày nói cc gì vậy?', 'tao dell thích hỏi', 'mày đang sử dụng google ai studio free nên trả lời ngu có phải không?']) {
      const response = await fetch(base + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, context }),
      });
      const data = await response.json();
      assert.equal(response.status, 200, message);
      assert.deepEqual(data.sources, [], message);
      assert.deepEqual(data.dataSources, [], message);
      assert.equal(data.grounded, false, message);
      assert.equal(data.textbookChecked, false, message);
    }
  });
  assert.equal(geminiCalls, 0);
});

test('a short topical follow-up uses only the immediately preceding user question', async () => {
  let generationPrompt = '';
  const mockFetch = async (url, options) => {
    if (String(url).includes('/v1beta/models?')) return new Response(JSON.stringify({ models: [
      { name: 'models/gemini-fast-a', supportedGenerationMethods: ['generateContent'] },
    ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    generationPrompt = JSON.parse(options.body).contents[0].parts[0].text;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Theo giáo trình, nội dung này có ba phương diện chính và được giải thích trong mục đã truy xuất.' }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  await withServer({ corpus, apiKeys: ['test-key'], fetchImpl: mockFetch }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Còn những mặt nào?',
        history: [
          { role: 'user', text: 'Tóm tắt Chương 1' },
          { role: 'assistant', text: 'Chương 1 giới thiệu một số khái niệm.' },
          { role: 'user', text: 'Sứ mệnh lịch sử của giai cấp công nhân là gì?' },
        ],
      }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.textbookChecked, true);
    assert.ok(data.sources.some((source) => source.section.includes('Nội dung sứ mệnh lịch sử')));
    assert.match(generationPrompt, /CÂU HỎI HIỆN TẠI:\nCòn những mặt nào/);
    assert.match(generationPrompt, /Sinh viên: Sứ mệnh lịch sử của giai cấp công nhân là gì/);
    assert.doesNotMatch(generationPrompt, /Tóm tắt Chương 1/);
  });
});

test('an explicitly relevant industrial question gets map context and source; a textbook-only question does not', async () => {
  const context = {
    location: 'Cà Mau', industry: 'Nhà máy Đạm Cà Mau', evidence: 'Bài báo ghi nhận mốc 11 triệu tấn urê lũy kế vào tháng 12/2024.',
    sources: [{ publisher: 'Báo Điện tử Chính phủ', title: 'Nhà máy Đạm Cà Mau cán mốc sản lượng 11 triệu tấn UREA', url: 'https://baochinhphu.vn/example' }],
  };
  await withServer({ corpus, apiKeys: [] }, async (base) => {
    for (const [message, expectedSources] of [
      ['Giai cấp công nhân là ai?', 0],
      ['Giai cấp công nhân đóng góp thế nào tại Nhà máy Đạm Cà Mau?', 1],
    ]) {
      const response = await fetch(base + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });
      const data = await response.json();
      assert.equal(response.status, 200);
      assert.equal(data.dataSources.length, expectedSources, message);
      assert.equal(data.answer.includes('Dữ kiện thực tế có nguồn'), Boolean(expectedSources), message);
    }
  });
});

test('Gemini quota rotates to the next configured key and malformed upstream HTML stays private', async () => {
  let generationCalls = 0;
  const fetchImpl = async (url) => {
    if (String(url).includes('/v1beta/models?')) return new Response(JSON.stringify({ models: [
      { name: 'models/gemini-fast-a', supportedGenerationMethods: ['generateContent'] },
    ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    generationCalls += 1;
    if (generationCalls === 1) return new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), { status: 429 });
    if (generationCalls === 2) return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Theo giáo trình, giai cấp công nhân gắn với nền đại công nghiệp hiện đại.' }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    return new Response('<!DOCTYPE html><html>upstream proxy failure</html>', { status: 502, headers: { 'Content-Type': 'text/html' } });
  };
  await withServer({ corpus, apiKeys: ['key-one', 'key-two', 'key-three'], fetchImpl }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Giai cấp công nhân là ai?' }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.model, 'gemini-fast-a');
    assert.match(data.answer, /nền đại công nghiệp/);
    assert.doesNotMatch(data.answer, /DOCTYPE|upstream proxy failure|Unexpected token/i);
  });
  assert.equal(generationCalls, 2, 'the second API key should be tried after a quota response');

  await withServer({ corpus, apiKeys: ['key-one'], fetchImpl: async (url) => {
    if (String(url).includes('/v1beta/models?')) return new Response(JSON.stringify({ models: [
      { name: 'models/gemini-fast-a', supportedGenerationMethods: ['generateContent'] },
    ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    return new Response('<!DOCTYPE html><html>proxy failure</html>', { status: 502, headers: { 'Content-Type': 'text/html' } });
  } }, async (base) => {
    const response = await fetch(base + '/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Giai cấp công nhân là ai?' }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.fallback, true);
    assert.match(data.answer, /nền đại công nghiệp/);
    assert.doesNotMatch(data.answer, /DOCTYPE|proxy failure|Unexpected token/i);
  });
});

test('health response describes loaded textbooks without exposing Gemini key configuration', async () => {
  await withServer({ corpus, apiKeys: ['never-return-this-key'] }, async (base) => {
    const response = await fetch(base + '/api/health');
    const data = await response.json();
    assert.equal(data.textbookCount, 2);
    assert.ok(data.textbooks.includes('1.GIaoTrinh_CNXHKH_Tr01_Tr66.txt'));
    assert.ok(data.textbooks.includes('2.GiaoTrinh_CNXHKH_Tr67_Tr144.txt'));
    assert.equal('keyCount' in data, false);
    assert.equal('configured' in data, false);
    assert.equal(JSON.stringify(data).includes('never-return-this-key'), false);
  });
});

test('backend serves preflight requests only with the configured frontend origin', async () => {
  await withServer({ corpus, apiKeys: [], corsOrigins: ['https://mekong-ui.vercel.app'] }, async (base) => {
    const allowed = await fetch(base + '/api/chat', {
      method: 'OPTIONS',
      headers: { Origin: 'https://mekong-ui.vercel.app', 'Access-Control-Request-Method': 'POST' },
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://mekong-ui.vercel.app');

    const rejected = await fetch(base + '/api/chat', {
      method: 'OPTIONS',
      headers: { Origin: 'https://unrelated.example', 'Access-Control-Request-Method': 'POST' },
    });
    assert.equal(rejected.status, 204);
    assert.equal(rejected.headers.get('access-control-allow-origin'), null);
  });
});
