import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';

export const normalize = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'd')
  .toLocaleLowerCase('vi')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

const words = (value) => normalize(value).match(/[\p{L}\p{N}]{2,}/gu) || [];

const stopWords = new Set(
  'ai a o i nhung la va cua cho trong voi ve nhu nao gi giua duoc hay mot cac nhieu tren duoi den tu khi tai theo co the khong phai do nay thi dang sao vi de hon tung viec qua ra vao ay nhe toi ban minh giup xin huong dan lam bang lo vi doi cach can dau nhung cung chung mot moi neu sau truoc roi rat hay hoc noi dung chuong mon giao trinh ml n chinh tom tat tom tat ve'.split(' ').map(normalize),
);

const contentTerms = (value) => {
  const tokens = words(value);
  return tokens.filter((word, index) => !stopWords.has(word)
    || (word === 'dan' && ['chu', 'toc'].includes(tokens[index + 1])));
};

const isHeading = (paragraph) => paragraph.length < 170 && (
  /^(chương|chuong)\s+\d+/i.test(paragraph)
  || /^(phần|phan|mục|muc|bài|bai)\s+[\divx]+/i.test(paragraph)
  || /^(?:[1-9]\d?(?:\.[1-9]\d?){1,3}(?:[.)])?|[1-9][.)])\s+\S/u.test(paragraph)
);

function cleanOcrHeading(paragraph) {
  return paragraph
    .replace(/^[jil|](?=\.(?:\d|[jil|]))/i, '1')
    .replace(/^(\d+\.)[jil|](?=\.)/i, '$11')
    .replace(/^(\d+)\.(\d)([1-9])(?=[.)]\s)/, '$1.$2.$3')
    .replace(/\s+[\\/|=~#«»*]+\s*\d{1,3}\s*[\\/|=~#«»*]*$/u, '')
    .replace(/[\s\p{P}\p{S}]+$/u, '')
    .trim();
}

const scannedBookChapterRanges = [
  { number: 1, start: 7, end: 27 },
  { number: 2, start: 28, end: 46 },
  { number: 3, start: 47, end: 66 },
  { number: 4, start: 67, end: 87 },
  { number: 5, start: 88, end: 103 },
  { number: 6, start: 104, end: 127 },
  { number: 7, start: 128, end: 144 },
];

function chapterAtPrintedPage(filename, page) {
  if (!/^(1\.GIaoTrinh_CNXHKH_Tr01_Tr66|2\.GiaoTrinh_CNXHKH_Tr67_Tr144)\.txt$/i.test(filename) || !page) return '';
  const match = scannedBookChapterRanges.find(({ start, end }) => page >= start && page <= end);
  return match ? 'Chương ' + match.number : '';
}

function splitLongParagraph(paragraph, limit) {
  if (paragraph.length <= limit) return [paragraph];
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [paragraph];
  const pieces = [];
  let current = '';
  for (const sentence of sentences) {
    const next = current ? current + ' ' + sentence.trim() : sentence.trim();
    if (current && next.length > limit) {
      pieces.push(current);
      current = sentence.trim();
    } else {
      current = next;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

export function splitChunks(text, filename, { maxLength = 1450 } = {}) {
  const paragraphs = text.replace(/\r/g, '').split(/(\f|\n+)/);
  const hasReliableWordPageNumbers = filename.toLowerCase().endsWith('.docx');
  const chunks = [];
  let chapter = 'Nội dung giáo trình';
  let section = chapter;
  let page = null;
  let content = [];
  let size = 0;
  let sequence = 0;
  let chunkPage = null;
  let summaryExcluded = false;
  const knownChapterStarts = filename === 'GIaoTrinh_CNXHKH_Tr01_Tr66.docx'
    ? { 1: 7, 2: 28, 3: 47, 4: 67, 5: 88, 6: 104, 7: 128 }
    : {};
  const hasScannedBookPageMap = /^(1\.GIaoTrinh_CNXHKH_Tr01_Tr66|2\.GiaoTrinh_CNXHKH_Tr67_Tr144)\.txt$/i.test(filename);

  const flush = () => {
    if (!content.length) return;
    const excerpt = content.join('\n');
    chunks.push({
      id: filename + '-' + sequence++,
      file: filename,
      chapter,
      section,
      page: chunkPage,
      summaryExcluded,
      text: excerpt,
      tokens: contentTerms(excerpt),
    });
    content = [];
    size = 0;
    chunkPage = null;
  };

  for (const rawParagraph of paragraphs) {
    if (rawParagraph === '\f') {
      flush();
      continue;
    }
    let paragraph = rawParagraph.replace(/\s+/g, ' ').trim();
    const headingCandidate = cleanOcrHeading(paragraph);
    if (!paragraph) continue;
    const scannedPage = paragraph.match(/^\[\[PAGE\s+(\d{1,3})\]\]$/i);
    if (scannedPage) {
      flush();
      page = Number(scannedPage[1]);
      const pageChapter = chapterAtPrintedPage(filename, page);
      if (pageChapter && normalize(pageChapter) !== normalize(chapter)) {
        chapter = pageChapter;
        section = chapter;
        summaryExcluded = false;
      }
      continue;
    }
    // Mammoth preserves Word page numbers as standalone lines in the supplied book.
    if (/^\d{1,3}$/.test(paragraph)) {
      const candidate = Number(paragraph);
      flush();
      if (hasReliableWordPageNumbers && candidate >= 1 && candidate <= 180 && (page === null || candidate > page)) page = candidate;
      continue;
    }
    if (/^\d{1,3}\s+[\p{P}\p{S}\s]+$/u.test(paragraph) || /^[\p{P}\p{S}\s]{1,18}$/u.test(paragraph)) continue;

    const chapterMatch = paragraph.match(/^(?:chương|chuong)\s+(\d+)/i);
    if (chapterMatch) {
      const pageChapter = chapterAtPrintedPage(filename, page);
      const headingChapter = 'Chương ' + Number(chapterMatch[1]);
      // The contents page repeats all chapter names. Printed page ranges keep those
      // entries from being mis-indexed as actual chapter bodies in the OCR corpus.
      if (!hasScannedBookPageMap || normalize(pageChapter) === normalize(headingChapter)) {
        flush();
        chapter = headingChapter;
        section = cleanOcrHeading(paragraph);
        summaryExcluded = false;
        if (knownChapterStarts[Number(chapterMatch[1])]) page = knownChapterStarts[Number(chapterMatch[1])];
      }
      continue;
    } else if (/^[a-d]\.\s+/i.test(paragraph)) {
      flush();
      section = cleanOcrHeading(paragraph);
      summaryExcluded = /^[acd]\.\s+/i.test(section);
      continue;
    } else if (isHeading(headingCandidate)) {
      flush();
      section = headingCandidate.replace(/\s+fr$/i, '');
      continue;
    }

    for (const piece of splitLongParagraph(paragraph, maxLength)) {
      if (content.length && size + piece.length > maxLength) flush();
      if (!content.length) chunkPage = page;
      content.push(piece);
      size += piece.length + 1;
    }
  }
  flush();
  return chunks;
}

async function listTextbookFiles(root, configuredDirectory) {
  const textbookDirectory = path.isAbsolute(configuredDirectory)
    ? configuredDirectory
    : path.resolve(root, configuredDirectory);
  const filePaths = new Set();

  const visit = async (directory, recursive, includeText) => {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isFile() && (/\.docx$/i.test(entry.name) || (includeText && /\.txt$/i.test(entry.name)))) filePaths.add(entryPath);
        else if (recursive && entry.isDirectory() && !entry.name.startsWith('.')) await visit(entryPath, true, includeText);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  };

  await visit(path.resolve(root), false, false);
  await visit(textbookDirectory, true, true);
  return [...filePaths].sort();
}

export async function textbookSignature(root, configuredDirectory = 'textbooks') {
  const filePaths = await listTextbookFiles(root, configuredDirectory);
  const versions = await Promise.all(filePaths.map(async (filePath) => {
    const stat = await fs.stat(filePath);
    return [path.relative(root, filePath), stat.size, stat.mtimeMs].join(':');
  }));
  return versions.join('|');
}

export async function loadTextbooks(root, configuredDirectory = 'textbooks') {
  const filePaths = await listTextbookFiles(root, configuredDirectory);
  const corpus = [];
  for (const filePath of filePaths) {
    const stat = await fs.stat(filePath);
    if (stat.size > 40 * 1024 * 1024) continue;
    const filename = path.basename(filePath);
    const text = path.extname(filePath).toLowerCase() === '.docx'
      ? (await mammoth.extractRawText({ buffer: await fs.readFile(filePath) })).value
      : (await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
    corpus.push(...splitChunks(text, filename));
  }
  return corpus;
}

export function expandTerms(question) {
  const query = normalize(question);
  const terms = contentTerms(question);
  const asksAboutWorkers = /\b(giai cap cong nhan|cong nhan)\b/.test(query);
  const asksAboutMission = /\b(su menh lich su|su mang|nhiem vu lich su|vai tro lich su)\b/.test(query);
  if (asksAboutWorkers) terms.push('giai', 'cap', 'cong', 'nhan', 'su', 'menh', 'lich');
  if (asksAboutMission) terms.push('su', 'menh', 'lich', 'giai', 'cap', 'cong', 'nhan');
  if (/\b(hoan thanh|thuc hien|thuc hien duoc|mang lai|dong gop|vai tro)\b/.test(query) && (asksAboutWorkers || asksAboutMission)) {
    terms.push('noi', 'dung', 'kinh', 'te', 'chinh', 'tri', 'xa', 'hoi', 'van', 'hoa', 'tu', 'tuong');
  }
  if (/\b(dong gop|vai tro|phat huy|gop phan|can lam gi)\b/.test(query)) {
    terms.push('su', 'menh', 'lich', 'dieu', 'kien', 'chu', 'quan', 'xay', 'dung', 'phat', 'trien');
  }
  return [...new Set(terms)];
}

const chapterWords = new Map([
  ['mot', 1], ['nhat', 1], ['i', 1],
  ['hai', 2], ['ii', 2],
  ['ba', 3], ['iii', 3],
  ['bon', 4], ['tu', 4], ['iv', 4],
  ['nam', 5], ['v', 5],
  ['sau', 6], ['vi', 6],
  ['bay', 7], ['vii', 7],
]);

export function requestedChapters(question) {
  const query = normalize(question);
  const chapters = [];
  for (const match of query.matchAll(/\b(?:chuong|chapter)\s+(?:thu\s+)?(\d+|[a-z]+)\b/g)) {
    const token = match[1];
    const number = /^\d+$/.test(token) ? Number(token) : chapterWords.get(token);
    if (number >= 1 && number <= 7 && !chapters.includes(number)) chapters.push(number);
  }
  return chapters;
}

function requestedChapter(question) {
  const chapters = requestedChapters(question);
  return chapters.length === 1 ? 'chương ' + chapters[0] : '';
}

export function isChapterSummaryIntent(question) {
  const query = normalize(question);
  return /\b(tom tat|tom luoc|tong quan|khai quat|noi dung chinh|noi dung co ban|trinh bay noi dung|noi ve gi|gom nhung gi|noi dung nao)\b/.test(query)
    && /\b(chuong|chapter|giao trinh)\b/.test(query);
}

export function hasAmbiguousChapterSummaryScope(question) {
  const query = normalize(question);
  if (/\b(?:chuong|chapter)\s+tu\s+\d+\s+den\s+\d+\b/.test(query)) return true;
  if (/\b(?:chuong|chapter)\s+(?:thu\s+)?(?:\d+|[a-z]+)\s+(?:den|toi)\s+(?:chuong\s+)?(?:thu\s+)?(?:\d+|[a-z]+)\b/.test(query)) return true;
  if (/\b(?:chương|chuong|chapter)\s+(?:(?:thứ|thu)\s+)?\d+\s*[-–—]\s*\d+\b/i.test(question)
      || /\b(?:chương|chuong|chapter)\s+(?:(?:thứ|thu)\s+)?\d+\s*,\s*\d+\b/i.test(question)) return true;
  return /\b(?:chuong|chapter)\s+(?:thu\s+)?(?:\d+|[a-z]+)\s+(?:va|and)\s+(?!(?:chuong|chapter)\s+)(?:thu\s+)?(?:\d+|[a-z]+)\b/.test(query);
}

export function isChapterSummaryQuestion(question) {
  return requestedChapters(question).length > 0
    && isChapterSummaryIntent(question)
    && !hasAmbiguousChapterSummaryScope(question);
}

export function retrieveChapterSummary(question, corpus, limit = 28) {
  const chapters = requestedChapters(question).map((number) => 'chương ' + number);
  if (!chapters.length) return [];
  const excluded = /tai lieu tham khao|cau hoi|danh muc tai lieu|van kien|c mac va ph angghen|muc tieu|ve kien thuc|ve ky nang|ve tu tuong|neu nhung|trinh bay|phan tich|dang cong san|hoc vien chinh tri|hoi dong|ta ngoc tan|hoang chi bao/;
  const perChapterLimit = Math.max(5, Math.floor(limit / chapters.length));
  const selected = [];
  for (const chapter of chapters) {
    const chapterChunks = corpus.filter((chunk) => normalize(chunk.chapter) === normalize(chapter));
    const candidates = chapterChunks.filter((chunk) => !chunk.summaryExcluded && !excluded.test(normalize(chunk.section)));
    const sectionGroups = new Map();
    for (const chunk of candidates) {
      const code = chunk.section.match(/^\s*(\d+(?:\.\d+){0,3})\b/)?.[1];
      if (!code) continue;
      if (!sectionGroups.has(code)) sectionGroups.set(code, []);
      sectionGroups.get(code).push(chunk);
    }

    let chapterSelection = [...sectionGroups.values()].map((chunks) => chunks[0]);
    if (!chapterSelection.length && candidates.length) {
      // If OCR damaged the headings, spread the evidence across the chapter instead
      // of silently substituting a different chapter's outline.
      const count = Math.min(perChapterLimit, candidates.length);
      chapterSelection = Array.from({ length: count }, (_, index) => (
        candidates[Math.floor(index * (candidates.length - 1) / Math.max(1, count - 1))]
      ));
    }
    selected.push(...chapterSelection.slice(0, perChapterLimit));
  }
  return selected;
}

export function retrieve(question, corpus, limit = 4) {
  if (isChapterSummaryIntent(question) && hasAmbiguousChapterSummaryScope(question)) return [];
  if (isChapterSummaryQuestion(question)) return retrieveChapterSummary(question, corpus);
  const queryTerms = expandTerms(question);
  if (!queryTerms.length || !corpus.length) return [];

  const normalizedQuestion = normalize(question);
  const missionQuery = /\b(su menh lich su|su mang|nhiem vu lich su|vai tro lich su)\b/.test(normalizedQuestion);
  const missionConditionQuery = /\b(dieu kien|nhan to|yeu to|quy dinh)\b/.test(normalizedQuestion);
  const workerQuery = /\bgiai cap cong nhan\b|\bcong nhan\b/.test(normalizedQuestion);
  const chapter = requestedChapter(question) || (missionQuery || workerQuery ? 'chương 2' : '');
  const searchCorpus = chapter
    ? corpus.filter((chunk) => normalize(chunk.chapter) === normalize(chapter))
    : corpus;
  if (!searchCorpus.length) return [];
  const documentFrequency = new Map();
  for (const chunk of searchCorpus) {
    for (const term of new Set(chunk.tokens)) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }
  const missionOverviewQuery = missionQuery && !missionConditionQuery
    && /\b(la gi|nhiem vu|tong quat|noi dung co ban|noi dung nao|gom|bao gom|nhung mat|phuong dien)\b/.test(normalizedQuestion);
  const definitionQuery = !missionQuery
    && /\bgiai cap cong nhan\b/.test(normalizedQuestion)
    && /\b(ai|la gi|khai niem|dinh nghia)\b/.test(normalizedQuestion);
  const workerApplicationQuery = workerQuery && /\b(dong gop|vai tro|phat huy|gop phan|nha may|nha xuong|doanh nghiep)\b/.test(normalizedQuestion);

  const ranked = searchCorpus.map((chunk) => {
    const counts = new Map();
    for (const token of chunk.tokens) counts.set(token, (counts.get(token) || 0) + 1);
    const matchedTerms = [];
    let score = 0;
    for (const term of queryTerms) {
      const count = counts.get(term) || 0;
      if (!count) continue;
      matchedTerms.push(term);
      const idf = Math.log(1 + (searchCorpus.length - (documentFrequency.get(term) || 0) + 0.5) / ((documentFrequency.get(term) || 0) + 0.5));
      score += idf * (count * 2.2) / (count + 1.2);
    }
    const normalizedText = normalize(chunk.text);
    const normalizedSection = normalize(chunk.section);
    if (definitionQuery && /tap doan xa hoi hinh thanh va phat trien/.test(normalizedText)) score += 18;
    else if (definitionQuery && /khai niem giai cap cong nhan/.test(normalizedText)) score += 6;
    if (missionOverviewQuery && /noi dung su menh lich su/.test(normalizedSection)) score += 14;
    if (missionOverviewQuery && !normalizedQuestion.includes('viet nam') && /viet nam hien nay/.test(normalizedSection)) score -= 15;
    if (missionOverviewQuery && /su menh lich su tong quat/.test(normalizedText)) score += 10;
    if (missionQuery && /su menh lich su/.test(normalizedText)) score += 3;
    if (missionQuery
        && /\b(mat nao|nhung mat|phuong dien|noi dung co ban)\b/.test(normalizedQuestion)
        && /ba noi dung co ban|ba phuong dien/.test(normalizedText)) {
      score += 8;
    }
    const section = normalize(chunk.section);
    if (workerQuery && !missionQuery && normalize(chunk.chapter) === 'chuong 2') {
      if (/^1 1 |^thu nhat khai niem giai cap cong nhan/.test(section)) score += 24;
      if (/^1 2 noi dung su menh lich su/.test(section)) score += workerApplicationQuery ? 28 : 18;
      if (/^1 3/.test(section)) score += workerApplicationQuery ? 16 : 8;
      if (/^2 1 giai cap cong nhan hien nay/.test(section)) score += 8;
      if (/^3 3 2/.test(section)) score += workerApplicationQuery ? 24 : 10;
    }
    return { ...chunk, score, matchedTerms: matchedTerms.length };
  });

  const recognizedCourseTopic = workerQuery || missionQuery || Boolean(chapter);
  const minimumMatches = recognizedCourseTopic
    ? 1
    : queryTerms.length >= 3 ? Math.max(2, Math.ceil(queryTerms.length * 0.25)) : 1;
  const missionSections = ranked.filter((chunk) => /^1 2 |^1 3|^2 2 |^3 2 |^3 3/.test(normalize(chunk.section)));
  const candidates = missionQuery && missionSections.length ? missionSections : ranked;
  const matches = candidates
    .filter((chunk) => chunk.matchedTerms >= minimumMatches && chunk.score >= 1.1)
    .sort((left, right) => right.score - left.score);
  const bestScore = matches[0]?.score || 0;
  return matches
    .filter((chunk) => chunk.score >= bestScore * 0.45)
    .slice(0, limit)
    .map(({ matchedTerms: _matchedTerms, ...chunk }) => chunk);
}

export function publicSources(matches) {
  const seen = new Set();
  return matches.flatMap(({ file, section, chapter, page, id }) => {
    const signature = [file, chapter, section, page || ''].join('|');
    if (seen.has(signature)) return [];
    seen.add(signature);
    return [{ id, file, section, chapter, ...(page ? { page } : {}) }];
  });
}

export function groundedFallback(question, matches) {
  const normalizedQuestion = normalize(question);
  const first = matches[0];
  if (isChapterSummaryIntent(question)) {
    const expectedChapters = requestedChapters(question).map((number) => 'chương ' + number);
    if (!expectedChapters.length) return 'Bạn muốn mình tóm tắt chương nào? Giáo trình có Chương 1 đến Chương 7; nêu số hoặc tên chương để mình lấy đúng phần, không đoán sang chương khác nhé.';
    const hasAllChapters = expectedChapters.every((chapter) => matches.some((match) => normalize(match.chapter) === normalize(chapter)));
    if (!hasAllChapters) return 'Mình chưa truy xuất đủ nội dung của chương bạn yêu cầu, nên không lấy chương khác thay thế. Bạn thử lại với một chương cụ thể hoặc hỏi theo tên mục trong giáo trình nhé.';

    const summaries = expectedChapters.map((chapter) => {
      const chapterMatches = matches.filter((match) => normalize(match.chapter) === normalize(chapter));
      const seenSections = new Set();
      const bullets = chapterMatches.flatMap((match) => {
        const section = match.section.trim();
        const key = normalize(section);
        if (!section || seenSections.has(key)) return [];
        seenSections.add(key);
        const sentences = (match.text.match(/[^.!?]+[.!?]+/g) || [match.text])
          .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
          .filter((sentence) => sentence.length > 45 && !/^chương\s+\d+/i.test(sentence));
        if (!sentences.length) return [];
        return ['• ' + section + ': ' + sentences.slice(0, 2).join(' ').slice(0, 500)];
      }).slice(0, 12);
      return chapter.replace(/^./, (letter) => letter.toUpperCase()) + '\n' + bullets.join('\n');
    });
    return 'Tóm tắt theo các mục đã truy xuất trong giáo trình:\n\n' + summaries.join('\n\n') + '\n\nCác nguồn bên dưới đều thuộc đúng chương được yêu cầu.';
  }
  const missionQuery = /\b(su menh lich su|su mang|nhiem vu lich su|vai tro lich su)\b/.test(normalizedQuestion);
  const missionConditionQuery = /\b(dieu kien|nhan to|yeu to|quy dinh)\b/.test(normalizedQuestion);
  const missionOverviewQuery = missionQuery && !missionConditionQuery
    && /\b(la gi|nhiem vu|tong quat|noi dung co ban|noi dung nao|gom|bao gom|nhung mat|phuong dien)\b/.test(normalizedQuestion);
  if (missionOverviewQuery) {
    const missionPassage = matches.find((match) => {
      const text = normalize(match.text);
      return /su menh lich su tong quat/.test(text) && /xoa bo|xay dung/.test(text);
    });
    if (missionPassage) {
      return 'Theo giáo trình, sứ mệnh lịch sử của giai cấp công nhân là thông qua chính đảng tiên phong, tổ chức và lãnh đạo nhân dân lao động đấu tranh xóa bỏ chủ nghĩa tư bản và áp bức, bóc lột, hướng tới xây dựng xã hội cộng sản chủ nghĩa văn minh. Giáo trình chia nội dung này thành ba mặt: kinh tế; chính trị – xã hội; văn hóa – tư tưởng.\nNguồn: ' + missionPassage.file + ', ' + missionPassage.section + (missionPassage.page ? ', trang ' + missionPassage.page : '') + '.';
    }
    return 'Mình chưa tìm thấy đoạn khái quát đủ rõ trong các phần đã khớp để trả lời chắc chắn. Hãy mở nguồn giáo trình bên dưới hoặc hỏi theo tên mục cụ thể nhé.';
  }

  const definitionQuery = !missionQuery
    && /\bgiai cap cong nhan\b/.test(normalizedQuestion)
    && /\b(ai|la gi|khai niem|dinh nghia)\b/.test(normalizedQuestion);
  if (definitionQuery) {
    const definitionPassage = matches.find((match) => /tap doan xa hoi hinh thanh va phat trien|khai niem giai cap cong nhan/.test(normalize(match.text)));
    if (definitionPassage) {
      return 'Trong giáo trình, giai cấp công nhân gắn với nền đại công nghiệp và phương thức lao động công nghiệp. Có thể hiểu đơn giản: đây là lực lượng lao động tham gia vào nền sản xuất công nghiệp hiện đại; muốn hiểu đúng khái niệm cần xét vị trí của họ trong sản xuất, không chỉ dựa vào tên nghề.\nNguồn: ' + definitionPassage.file + ', ' + definitionPassage.section + (definitionPassage.page ? ', trang ' + definitionPassage.page : '') + '.';
    }
  }

  const sentences = matches.flatMap((match) => match.text.match(/[^.!?]+[.!?]+/g) || [match.text])
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length > 35);
  const terms = expandTerms(question);
  const best = sentences
    .map((sentence) => ({ sentence, score: terms.reduce((sum, term) => sum + (normalize(sentence).includes(term) ? 1 : 0), 0) }))
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 2)
    .map((entry) => entry.sentence.slice(0, 320));

  if (!first || !best.length) {
    return 'Mình tìm thấy mục liên quan trong giáo trình nhưng chưa đủ đoạn trích để trả lời chắc chắn. Bạn thử hỏi theo tên mục hoặc một khái niệm cụ thể trong sách nhé.';
  }
  return 'Mình tìm thấy nội dung liên quan ở ' + first.section + '. Ý chính trong đoạn này:\n• ' + best.join('\n• ');
}

