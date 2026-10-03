import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Bot,
    Check,
    ChevronRight,
    ExternalLink,
    Factory,
    MapPin,
    Menu,
    MessageCircle,
    Plus,
    Send,
    Sparkles,
    Waves,
    X,
} from 'lucide-react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { locations, solutions, sources, theory } from './data.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const markerIcon = (active) =>
    L.divIcon({
        className: 'mekong-marker-host',
        html: '<span class="mekong-marker' + (active ? ' active' : '') + '"><i></i><b>✳</b></span>',
        iconSize: [42, 50],
        iconAnchor: [21, 42],
    });

function Header({ onAsk }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="site-header">
            <a
                className="wordmark"
                href="#top"
                onClick={closeMenu}
                aria-label="Mạch Mekong, đầu trang"
            >
                <span className="brand-mark">
                    <Waves size={21} strokeWidth={1.8} />
                </span>
                <span>
                    MẠCH MEKONG<small>LAO ĐỘNG · SẢN XUẤT · ĐỒNG BẰNG</small>
                </span>
            </a>
            <button
                className="mobile-menu"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Mở điều hướng"
            >
                {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <nav
                className={menuOpen ? 'main-nav is-open' : 'main-nav'}
                aria-label="Điều hướng chính"
            >
                <a href="#atlas" onClick={closeMenu}>
                    Bản đồ các quá trình
                </a>
                <a href="#book" onClick={closeMenu}>
                    Học từ giáo trình
                </a>
                <a href="#lab" onClick={closeMenu}>
                    Thử ý tưởng
                </a>
            </nav>
            <button className="header-ask" onClick={onAsk}>
                <MessageCircle size={17} /> HỎI BÀI <ArrowUpRight size={15} />
            </button>
        </header>
    );
}

function Hero({ onExplore }) {
    return (
        <section className="hero-shell" id="top">
            <div className="hero-copy">
                <div className="eyebrow">
                    <span className="eyebrow-dot" /> MỘT BẢN ĐỒ HỌC TẬP VỀ ĐỒNG BẰNG SÔNG CỬU LONG
                </div>
                <h1>
                    Ai làm nên
                    <br />
                    <em>những chuyển động?</em>
                </h1>
                <p className="hero-lede">
                    Chọn một địa phương để xem một quá trình sản xuất, ai đang tham gia và điều gì
                    giáo trình giúp ta đặt câu hỏi về người lao động.
                </p>
                <div className="hero-actions">
                    <button className="primary-button" onClick={onExplore}>
                        KHÁM PHÁ BẢN ĐỒ <ArrowDownRight size={17} />
                    </button>
                    <span>
                        <i /> 5 ĐỊA PHƯƠNG <b>·</b> CÁC LĨNH VỰC CÔNG NGHIỆP
                    </span>
                </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
                <div className="visual-glow" />
                <div className="visual-ring ring-one" />
                <div className="visual-ring ring-two" />
                <div className="visual-ring ring-three" />
                <svg className="delta-art" viewBox="0 0 520 510" fill="none">
                    <path
                        d="M260 34c-22 41-5 73-34 112-24 32-63 45-64 83-1 36 34 53 27 88-6 34-42 53-40 91 2 36 25 66 16 106M283 29c-9 48 18 78 1 120-15 37-48 54-44 93 3 35 40 48 46 83 6 33-16 59-9 96 7 38 40 57 37 96M305 43c12 40 36 65 29 105-7 38-32 61-20 97 11 33 47 39 63 69 16 28 6 59 25 90 19 31 52 39 69 73M233 53c-30 38-35 68-72 90-34 20-73 15-99 45-24 28-2 58-22 89-18 29-54 38-68 72-15 35 2 67-18 101"
                        stroke="currentColor"
                        strokeWidth="1.25"
                    />
                    <path
                        d="M261 35c-5 50 5 91-19 133-21 37-54 53-51 92 3 39 40 54 33 89-7 34-38 50-35 86 3 37 27 62 18 103M270 29c11 52 28 84 20 131-7 42-36 67-24 105 11 36 49 47 51 81 2 34-20 55-11 91 9 38 41 56 40 96M222 115c-40 26-70 25-100 56M195 199c-41 12-67 37-98 40M171 306c-40 5-67 25-100 46M330 170c35 14 54 43 89 53M348 258c39 4 64 25 95 47M379 350c39 10 60 35 84 63"
                        stroke="currentColor"
                        strokeWidth=".8"
                        strokeDasharray="2 6"
                    />
                    <path
                        d="M261 109c30 54-6 75 8 113 15 39 61 43 58 84-2 39-40 50-35 88M236 152c-38 32-13 63-36 91-22 27-56 26-59 62M300 184c42 22 32 54 65 74 29 18 55 10 70 45"
                        stroke="#efce83"
                        strokeWidth="1.5"
                        strokeDasharray="3 7"
                    />
                    <circle cx="268" cy="260" r="7" fill="#f18d6b" />
                    <circle cx="268" cy="260" r="19" stroke="#f18d6b" strokeOpacity=".5" />
                    <circle cx="174" cy="207" r="4" fill="#efce83" />
                    <circle cx="365" cy="334" r="4" fill="#efce83" />
                    <circle cx="214" cy="381" r="4" fill="#9cdbbd" />
                </svg>
                <div className="visual-caption caption-top">
                    <span>09°48′ N</span>
                    <i /> VÙNG ĐẤT CHÍN RỒNG
                </div>
                <div className="visual-caption caption-bottom">
                    <span className="caption-pulse" /> CON NGƯỜI LÀM NÊN DÒNG CHẢY
                </div>
                <div className="visual-number">09</div>
                <div className="visual-stamp">
                    SẢN XUẤT
                    <br />
                    ĐỜI SỐNG
                    <br />
                    <em>VAI TRÒ</em>
                </div>
            </div>
            <div className="hero-bottom">
                <span>MLN131 · CHỦ NGHĨA XÃ HỘI KHOA HỌC</span>
                <a href="#atlas">
                    CUỘN XUỐNG ĐỂ BẮT ĐẦU <ArrowDown size={13} />
                </a>
            </div>
        </section>
    );
}

function CentralQuestion({ onAsk }) {
    const question =
        'Dùng tiêu chí nào trong Chương 2 để phân biệt người lao động công nghiệp với lao động nông nghiệp hoặc dịch vụ? Giải thích ngắn gọn và nêu điều cần biết trước khi kết luận.';
    return (
        <section className="central-question section-pad" aria-labelledby="central-question-title">
            <div className="central-question-mark">
                <Sparkles size={19} />
            </div>
            <div>
                <span className="section-kicker">
                    <span>GỢI Ý KHI KHÁM PHÁ</span>
                    <i />
                </span>
                <h2 id="central-question-title">Có máy móc là thành công nhân?</h2>
                <p>
                    Chưa thể kết luận chỉ từ máy móc hay tên nghề. Hãy xem họ làm việc thế nào, ở
                    khâu nào, có tư liệu sản xuất hay làm thuê — rồi đối chiếu với giáo trình.
                </p>
            </div>
            <button className="central-question-ask" onClick={() => onAsk(question)}>
                CÙNG PHÂN TÍCH <ArrowUpRight size={15} />
            </button>
        </section>
    );
}

function IndustryDetail({ place, caseStudy, onAsk }) {
    const usedSources = caseStudy.sourceIds.map((id) => sources[id]).filter(Boolean);

    return (
        <div className="industry-detail" aria-live="polite">
            <div className="industry-label">
                <span>{caseStudy.status}</span>
                <span className="industry-pulse" />
            </div>
            <div className="industry-title-row">
                <div>
                    <span className="industry-kicker">{caseStudy.label}</span>
                    <h3>{caseStudy.title}</h3>
                </div>
                <span className="industry-number">
                    {String(place.cases.findIndex((item) => item.id === caseStudy.id) + 1).padStart(
                        2,
                        '0',
                    )}
                </span>
            </div>
            <p className="industry-summary">{caseStudy.summary}</p>
            <div className="production-flow">
                <div className="flow-heading">
                    <span>CÁC KHÂU THƯỜNG GẶP · TÙY CƠ SỞ</span>
                    <span>{caseStudy.steps.length} GIAI ĐOẠN</span>
                </div>
                <div className="flow-steps">
                    {caseStudy.steps.map((step, index) => (
                        <div className="flow-step" key={step}>
                            <span className="flow-index">{String(index + 1).padStart(2, '0')}</span>
                            <span>{step}</span>
                            {index < caseStudy.steps.length - 1 && (
                                <ChevronRight className="flow-arrow" size={15} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="worker-impact-card">
                <span>GIAI CẤP CÔNG NHÂN ĐÓNG GÓP THẾ NÀO?</span>
                <p>{caseStudy.workerContribution}</p>
            </div>
            <div className="worker-role-card">
                <span>CẦN LÀM GÌ ĐỂ PHÁT HUY VAI TRÒ?</span>
                <p>{caseStudy.promoteRole}</p>
            </div>
            <div className="book-link-card">
                <div className="book-link-icon">
                    <BookOpen size={18} />
                </div>
                <div>
                    <span>LIÊN HỆ VỚI GIÁO TRÌNH</span>
                    <p>{caseStudy.textbook}</p>
                    <small>CHƯƠNG 2 · GIAI CẤP CÔNG NHÂN VÀ SỨ MỆNH LỊCH SỬ</small>
                </div>
            </div>
            <div className="source-list">
                <span className="source-heading">
                    ĐỌC NGUỒN GỐC <span>· {usedSources.length} TÀI LIỆU</span>
                </span>
                <div>
                    {usedSources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                            <span>
                                <b>{source.publisher}</b>
                                <small>{source.title}</small>
                            </span>
                            <ExternalLink size={15} />
                        </a>
                    ))}
                </div>
            </div>
            <button
                className="ask-about"
                onClick={() =>
                    onAsk(
                        'Giai cấp công nhân đóng góp và có thể phát huy vai trò thế nào trong ' +
                            caseStudy.title +
                            ' tại ' +
                            place.name +
                            '? Hãy bám sát Chương 2 giáo trình MLN131, phân biệt luận điểm trong sách với dữ kiện thực tế đã có nguồn.',
                        {
                            location: place.name,
                            industry: caseStudy.title,
                            evidence: caseStudy.summary,
                            workerContribution: caseStudy.workerContribution,
                            promoteRole: caseStudy.promoteRole,
                            textbookLink: caseStudy.textbook,
                            sources: usedSources,
                        },
                    )
                }
            >
                <MessageCircle size={16} /> HỎI VỀ LĨNH VỰC NÀY <ArrowUpRight size={14} />
            </button>
        </div>
    );
}

function AtlasExplorer({ onAsk, onContextChange }) {
    const [selectedPlaceId, setSelectedPlaceId] = useState('ca-mau');
    const selectedPlace = useMemo(
        () => locations.find((place) => place.id === selectedPlaceId) || locations[0],
        [selectedPlaceId],
    );
    const [selectedCaseId, setSelectedCaseId] = useState(selectedPlace.cases[0].id);
    const selectedCase =
        selectedPlace.cases.find((caseStudy) => caseStudy.id === selectedCaseId) ||
        selectedPlace.cases[0];
    const studyContext = useMemo(
        () => ({
            location: selectedPlace.name,
            industry: selectedCase.title,
            evidence: selectedCase.summary,
            workerContribution: selectedCase.workerContribution,
            promoteRole: selectedCase.promoteRole,
            textbookLink: selectedCase.textbook,
            sources: selectedCase.sourceIds.map((id) => sources[id]).filter(Boolean),
        }),
        [selectedCase, selectedPlace],
    );

    useEffect(() => {
        onContextChange?.(studyContext);
    }, [onContextChange, studyContext]);

    function choosePlace(placeId) {
        const next = locations.find((place) => place.id === placeId);
        if (!next) return;
        setSelectedPlaceId(next.id);
        setSelectedCaseId(next.cases[0].id);
    }

    function chooseCase(caseId) {
        setSelectedCaseId(caseId);
    }

    return (
        <section className="atlas-section section-pad" id="atlas">
            <div className="section-heading">
                <div>
                    <div className="section-kicker">
                        <span>01</span>
                        <i /> BẢN ĐỒ CÔNG NGHIỆP ĐBSCL
                    </div>
                    <h2>
                        Mỗi vùng đất
                        <br />
                        <em>một nền sản xuất hiện đại.</em>
                    </h2>
                </div>
                <p>
                    Chọn địa phương và một lĩnh vực công nghiệp để tìm hiểu quy trình, đóng góp của
                    công nhân và cách phát huy vai trò của họ.
                </p>
            </div>
            <div className="atlas-instruction">
                <span>
                    <MapPin size={15} /> CHỌN ĐỊA PHƯƠNG
                </span>
                <i />
                <span>
                    <Factory size={15} /> CHỌN LĨNH VỰC CÔNG NGHIỆP
                </span>
                <i />
                <span>
                    <BookOpen size={15} /> KHÁM PHÁ VAI TRÒ
                </span>
            </div>
            <div className="map-workbench">
                <div className="map-panel">
                    <div className="map-topbar">
                        <span>
                            <i /> ĐỒNG BẰNG SÔNG CỬU LONG
                        </span>
                        <span>
                            5 ĐỊA PHƯƠNG <b>·</b> CÔNG NGHIỆP
                        </span>
                    </div>
                    <MapContainer
                        center={[9.82, 105.55]}
                        zoom={8.2}
                        zoomSnap={0.1}
                        minZoom={8.2}
                        maxZoom={8.2}
                        maxBounds={[
                            [8.9, 104.35],
                            [10.85, 106.7],
                        ]}
                        maxBoundsViscosity={1}
                        dragging={false}
                        touchZoom={false}
                        doubleClickZoom={false}
                        scrollWheelZoom={false}
                        boxZoom={false}
                        keyboard={false}
                        zoomControl={false}
                        attributionControl
                        className="leaflet-map"
                        aria-label="Bản đồ cố định có đúng năm điểm học tập ở Cần Thơ, An Giang, Đồng Tháp, Vĩnh Long và Cà Mau."
                    >
                        <TileLayer
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                            keepBuffer={4}
                            updateWhenIdle
                        />
                        {locations.map((place) => (
                            <Marker
                                key={place.id}
                                position={[place.lat, place.lng]}
                                icon={markerIcon(place.id === selectedPlaceId)}
                                eventHandlers={{ click: () => choosePlace(place.id) }}
                                keyboard={false}
                                title={'Chọn ' + place.name}
                                alt={'Điểm học tập ' + place.name}
                            >
                                <Tooltip direction="top" offset={[0, -34]}>
                                    {place.name}
                                </Tooltip>
                            </Marker>
                        ))}
                    </MapContainer>
                    <div className="map-overlay-label">
                        <span>
                            <i /> ĐIỂM ĐẠI DIỆN ĐỊA PHƯƠNG
                        </span>
                        <small>Không phải tọa độ nhà máy hay ranh giới hành chính</small>
                    </div>
                    <div className="map-places" aria-label="Chọn một trong năm địa phương">
                        {locations.map((place, index) => (
                            <button
                                key={place.id}
                                onClick={() => choosePlace(place.id)}
                                className={selectedPlace.id === place.id ? 'active' : ''}
                                aria-pressed={selectedPlace.id === place.id}
                            >
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                {place.name}
                            </button>
                        ))}
                    </div>
                </div>
                <aside
                    className="industry-panel"
                    aria-label={'Khám phá các quá trình sản xuất tại ' + selectedPlace.name}
                >
                    <div className="place-heading">
                        <div>
                            <span className="place-type">
                                {selectedPlace.type} <i>·</i> ĐBSCL
                            </span>
                            <h3>{selectedPlace.name}</h3>
                            <p>{selectedPlace.intro}</p>
                        </div>
                        <div className="place-seal">
                            <Factory size={22} />
                            <span>
                                ĐỊA
                                <br />
                                PHƯƠNG
                            </span>
                        </div>
                    </div>
                    <div className="industry-picker">
                        <div className="picker-heading">
                            <span>CHỌN LĨNH VỰC CÔNG NGHIỆP</span>
                            <span>
                                {String(selectedPlace.cases.length).padStart(2, '0')} LĨNH VỰC
                            </span>
                        </div>
                        <div
                            className="industry-options"
                            role="tablist"
                            aria-label={'Lĩnh vực công nghiệp tại ' + selectedPlace.name}
                        >
                            {selectedPlace.cases.map((caseStudy, index) => (
                                <button
                                    role="tab"
                                    aria-selected={selectedCase.id === caseStudy.id}
                                    className={selectedCase.id === caseStudy.id ? 'selected' : ''}
                                    key={caseStudy.id}
                                    onClick={() => chooseCase(caseStudy.id)}
                                >
                                    <span className="industry-option-no">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="industry-option-copy">
                                        <b>{caseStudy.title}</b>
                                        <small>{caseStudy.label}</small>
                                    </span>
                                    <ArrowRight size={15} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            className="industry-content"
                            key={selectedPlace.id + selectedCase.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.18 }}
                        >
                            <IndustryDetail
                                place={selectedPlace}
                                caseStudy={selectedCase}
                                onAsk={onAsk}
                            />
                        </motion.div>
                    </AnimatePresence>
                </aside>
            </div>
            <div className="map-footnote">
                <span>
                    <i /> 5 ĐIỂM HỌC TẬP
                </span>
                <p>
                    Các chấm đánh dấu vị trí đại diện của địa phương. Chọn điểm hoặc tên địa phương
                    để đổi nội dung; bản đồ được giữ cố định để bạn tập trung vào vùng học tập.
                </p>
            </div>
        </section>
    );
}

function TextbookRoom() {
    const [activeId, setActiveId] = useState(theory[0].id);
    const active = theory.find((item) => item.id === activeId) || theory[0];
    return (
        <section className="book-section section-pad" id="book">
            <div className="section-heading book-section-heading">
                <div>
                    <div className="section-kicker">
                        <span>02</span>
                        <i /> HỌC TỪ GIÁO TRÌNH
                    </div>
                    <h2>
                        Biến khái niệm
                        <br />
                        <em>thành điều dễ hiểu.</em>
                    </h2>
                </div>
            </div>
            <div className="book-layout">
                <div className="book-display">
                    <div className="textbook-art">
                        <div className="textbook-spine" />
                        <div className="textbook-cover">
                            <span className="cover-overline">GIÁO TRÌNH</span>
                            <b>
                                CHỦ NGHĨA
                                <br />
                                XÃ HỘI
                                <br />
                                KHOA HỌC
                            </b>
                            <div className="cover-emblem">
                                <Waves size={27} />
                                <span>MLN131</span>
                            </div>
                            <small>
                                CHƯƠNG 2<br />
                                GIAI CẤP CÔNG NHÂN
                            </small>
                        </div>
                        <div className="book-shine" />
                    </div>
                    <div className="book-display-note">
                        <BookOpen size={15} />
                        <span>
                            GIÁO TRÌNH ĐÍNH KÈM
                            <br />
                            <b>Chương 2 · giai cấp công nhân</b>
                        </span>
                    </div>
                    <div className="book-decoration">ĐỌC · LIÊN HỆ · ĐẶT CÂU HỎI</div>
                </div>
                <div className="book-reading">
                    <div
                        className="book-tab-list"
                        role="tablist"
                        aria-label="Chọn một ý trong giáo trình"
                    >
                        {theory.map((item) => (
                            <button
                                role="tab"
                                aria-selected={active.id === item.id}
                                key={item.id}
                                className={active.id === item.id ? 'active' : ''}
                                onClick={() => setActiveId(item.id)}
                            >
                                {item.label}
                                <ArrowUpRight size={14} />
                            </button>
                        ))}
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.article
                            className="book-article"
                            key={active.id}
                            initial={{ opacity: 0, y: 9 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.18 }}
                        >
                            <span className="article-page">{active.page}</span>
                            <h3>{active.title}</h3>
                            <p>{active.text}</p>
                            <div className="book-takeaway">
                                <span>GHI NHỚ</span>
                                <p>{active.takeaway}</p>
                            </div>
                        </motion.article>
                    </AnimatePresence>
                    <div className="book-bottom-note">
                        <span>GIẢI THÍCH NGẮN, KHÔNG THAY THẾ NGUYÊN VĂN GIÁO TRÌNH</span>
                        <BookOpen size={16} />
                    </div>
                </div>
            </div>
        </section>
    );
}

const labPlaces = [
    { id: 'an-giang', name: 'AN GIANG', x: 76, y: 54 },
    { id: 'dong-thap', name: 'ĐỒNG THÁP', x: 145, y: 76 },
    { id: 'can-tho', name: 'CẦN THƠ', x: 211, y: 111 },
    { id: 'vinh-long', name: 'VĨNH LONG', x: 282, y: 120 },
    { id: 'ca-mau', name: 'CÀ MAU', x: 173, y: 185 },
];
const labLinks = [
    ['an-giang', 'dong-thap', 'M76 54 Q111 61 145 76'],
    ['dong-thap', 'can-tho', 'M145 76 Q180 87 211 111'],
    ['can-tho', 'vinh-long', 'M211 111 Q245 115 282 120'],
    ['can-tho', 'ca-mau', 'M211 111 Q212 155 173 185'],
    ['vinh-long', 'ca-mau', 'M282 120 Q237 159 173 185'],
];

function IdeaLab() {
    const [selected, setSelected] = useState([]);
    const activeSolutions = solutions.filter((solution) => selected.includes(solution.id));
    const litPlaces = new Set(activeSolutions.flatMap((solution) => solution.locationIds));
    const isLinkLit = (from, to) =>
        activeSolutions.some(
            (solution) => solution.locationIds.includes(from) && solution.locationIds.includes(to),
        );

    function toggle(id) {
        setSelected((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    return (
        <section className="lab-section section-pad" id="lab">
            <div className="section-heading">
                <div>
                    <div className="section-kicker">
                        <span>03</span>
                        <i /> PHÒNG THỬ Ý TƯỞNG
                    </div>
                    <h2>
                        Chọn hướng đi,
                        <br />
                        <em>thắp sáng bản đồ.</em>
                    </h2>
                </div>
                <p>
                    Chọn một hay nhiều ý tưởng. Bản đồ sẽ sáng lên ở những địa phương có liên quan —
                    đây là cách để cùng thảo luận, không phải dự đoán.
                </p>
            </div>
            <div className="lab-grid">
                <div className="lab-choices">
                    <div className="lab-choice-heading">
                        <span>CHỌN MỘT Ý TƯỞNG</span>
                        <span>{String(solutions.length).padStart(2, '0')} HƯỚNG</span>
                    </div>
                    {solutions.map((solution, index) => (
                        <button
                            key={solution.id}
                            className={
                                'solution-card' + (selected.includes(solution.id) ? ' chosen' : '')
                            }
                            aria-pressed={selected.includes(solution.id)}
                            onClick={() => toggle(solution.id)}
                            style={{ '--solution-color': solution.color }}
                        >
                            <span className="solution-index">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="solution-copy">
                                <b>{solution.title}</b>
                                <small>{solution.detail}</small>
                            </span>
                            <span className="solution-toggle">
                                {selected.includes(solution.id) ? (
                                    <Check size={16} />
                                ) : (
                                    <Plus size={16} />
                                )}
                            </span>
                        </button>
                    ))}
                    <p className="lab-book-note">
                        <BookOpen size={15} /> Các hướng gợi ý liên hệ với nội dung Chương 2 về phát
                        triển sản xuất, học nghề và đời sống người lao động.
                    </p>
                </div>
                <div className="idea-board">
                    <div className="board-heading">
                        <span>
                            <i className="board-live" /> BẢN ĐỒ Ý TƯỞNG
                        </span>
                        <span>
                            {activeSolutions.length
                                ? activeSolutions.length + ' HƯỚNG ĐANG CHỌN'
                                : 'CHƯA CÓ HƯỚNG NÀO ĐƯỢC CHỌN'}
                        </span>
                    </div>
                    <div className={'board-map' + (activeSolutions.length ? ' has-light' : '')}>
                        <div className="board-orbit orbit-a" />
                        <div className="board-orbit orbit-b" />
                        <svg
                            viewBox="0 0 380 225"
                            role="img"
                            aria-label="Năm địa phương; các đường và điểm sáng thể hiện nơi liên quan đến ý tưởng đã chọn."
                        >
                            <path
                                d="m54 39 48-17 49 17 40-4 49 22 51-5 41 36-20 39 13 28-39 26-45-13-27 37-41-8-31-25-32-19-26-38-25-38Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.15"
                            />
                            {labLinks.map(([from, to, path]) => (
                                <path
                                    key={from + to}
                                    className={'idea-link' + (isLinkLit(from, to) ? ' lit' : '')}
                                    d={path}
                                />
                            ))}
                            {labPlaces.map((place, index) => {
                                const lit = litPlaces.has(place.id);
                                return (
                                    <g
                                        key={place.id}
                                        className={'idea-node' + (lit ? ' lit' : '')}
                                        style={{ '--node-delay': index * 70 + 'ms' }}
                                    >
                                        <circle
                                            className="node-halo"
                                            cx={place.x}
                                            cy={place.y}
                                            r="14"
                                        />
                                        <circle
                                            className="node-ring"
                                            cx={place.x}
                                            cy={place.y}
                                            r="7"
                                        />
                                        <circle
                                            className="node-center"
                                            cx={place.x}
                                            cy={place.y}
                                            r="2.7"
                                        />
                                        <text x={place.x + 10} y={place.y - 9}>
                                            {place.name}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                        <div className="board-legend">
                            {activeSolutions.length ? (
                                activeSolutions.map((solution) => (
                                    <span key={solution.id}>
                                        <i style={{ background: solution.color }} />
                                        {solution.title}
                                    </span>
                                ))
                            ) : (
                                <span>CHỌN Ý TƯỞNG ĐỂ THẤY CÁC ĐIỂM VÙNG LIÊN QUAN</span>
                            )}
                        </div>
                        <span className="board-caption">LƯỢC ĐỒ THẢO LUẬN · KHÔNG THEO TỶ LỆ</span>
                    </div>
                    <div className="board-outcomes">
                        {activeSolutions.length ? (
                            activeSolutions.map((solution) => (
                                <div
                                    className="outcome-card"
                                    key={solution.id}
                                    style={{ '--solution-color': solution.color }}
                                >
                                    <span>
                                        <Check size={15} />
                                    </span>
                                    <div>
                                        <b>{solution.title}</b>
                                        <p>{solution.outcome}</p>
                                        <small>
                                            {solution.locationIds
                                                .map(
                                                    (id) =>
                                                        locations.find((place) => place.id === id)
                                                            ?.name,
                                                )
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="board-empty">
                                <span>
                                    <Sparkles size={20} />
                                </span>
                                <p>
                                    Chọn một hướng bên cạnh
                                    <br />
                                    để thấy nơi có thể cùng phát triển.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="board-footer">
                        <span>
                            {activeSolutions.length} / {solutions.length} Ý TƯỞNG ĐANG SÁNG
                        </span>
                        <button onClick={() => setSelected([])} disabled={!selected.length}>
                            XÓA LỰA CHỌN <X size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ChatDrawer({ open, onClose, initialQuestion, studyContext }) {
    const [textbooks, setTextbooks] = useState([]);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Chào bạn! Bạn có thể hỏi về nội dung MLN131, nhờ giải thích dễ hiểu hoặc liên hệ với lĩnh vực đang xem trên bản đồ.',
        },
    ]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        fetch(API_BASE_URL + '/api/health')
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (data) setTextbooks(data.textbooks || []);
            })
            .catch(() => setTextbooks([]));
        return undefined;
    }, [open]);

    useEffect(() => {
        if (initialQuestion) setInput(initialQuestion);
    }, [initialQuestion]);

    useEffect(() => {
        if (!open) return undefined;
        document.body.classList.add('drawer-open');
        const keyHandler = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', keyHandler);
        return () => {
            document.body.classList.remove('drawer-open');
            window.removeEventListener('keydown', keyHandler);
        };
    }, [open, onClose]);

    async function submit(event, preset) {
        event?.preventDefault();
        const question = (preset || input).trim();
        if (!question || busy) return;
        setMessages((current) => [...current, { role: 'user', text: question }]);
        setInput('');
        setBusy(true);
        try {
            const response = await fetch(API_BASE_URL + '/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: question,
                    history: messages.slice(-8).map(({ role, text }) => ({ role, text })),
                    context: studyContext,
                }),
            });
            const contentType = response.headers.get('content-type') || '';
            const body = await response.text();
            let data;
            try {
                data = JSON.parse(body);
            } catch {
                const status = response.status ? ' (HTTP ' + response.status + ')' : '';
                throw new Error(
                    'Dịch vụ chat đang trả về lỗi kết nối' +
                        status +
                        '. Bạn thử lại sau ít phút nhé.',
                );
            }
            if (!response.ok) throw new Error(data.error || 'Không gửi được câu hỏi.');
            if (!contentType.includes('application/json') || typeof data.answer !== 'string') {
                throw new Error(
                    'Dịch vụ chat chưa trả về câu trả lời hợp lệ. Bạn thử lại sau nhé.',
                );
            }
            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    text: data.answer,
                    sources: data.sources || [],
                    dataSources: data.dataSources || [],
                    grounded: Boolean(data.grounded),
                    fallback: Boolean(data.fallback),
                    textbookChecked: Boolean(data.textbookChecked),
                },
            ]);
        } catch (error) {
            const safeMessage =
                error instanceof TypeError
                    ? 'Mình không kết nối được dịch vụ chat. Bạn kiểm tra kết nối rồi thử lại nhé.'
                    : error.message;
            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    text:
                        'Mình chưa nhận được câu trả lời. Bạn thử gửi lại sau nhé. ' + safeMessage,
                },
            ]);
        } finally {
            setBusy(false);
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        className="drawer-scrim"
                        aria-label="Đóng cửa sổ hỏi bài"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        className="chat-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="chat-title"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 31, stiffness: 260 }}
                    >
                        <div className="chat-head">
                            <div className="chat-avatar">
                                <Bot size={20} />
                            </div>
                            <div>
                                <span>CÙNG ÔN MLN131</span>
                                <h2 id="chat-title">Góc hỏi bài</h2>
                            </div>
                            <button className="close-chat" onClick={onClose} aria-label="Đóng">
                                <X size={19} />
                            </button>
                        </div>
                        <div className="chat-scope">
                            <BookOpen size={15} />
                            <span>
                                <b>
                                    {textbooks.length
                                        ? textbooks.length + ' giáo trình đang được dùng'
                                        : 'Học liệu môn MLN131'}
                                </b>
                                <small>
                                    {textbooks.length
                                        ? textbooks.join(' · ')
                                        : 'Câu trả lời sẽ dựa trên giáo trình hiện có.'}
                                </small>
                            </span>
                        </div>
                        <div className="chat-rule">
                            <Sparkles size={14} /> ĐỐI CHIẾU GIÁO TRÌNH KHI CÂU HỎI CÓ LIÊN QUAN
                        </div>
                        <div className="chat-feed" aria-live="polite">
                            {messages.map((message, index) => (
                                <div className={'chat-turn ' + message.role} key={index}>
                                    <div className="chat-bubble">{message.text}</div>
                                    {message.sources?.length > 0 && (
                                        <div className="chat-source-list">
                                            <span>MỤC GIÁO TRÌNH ĐÃ ĐỐI CHIẾU</span>
                                            {message.sources.slice(0, 2).map((source) => (
                                                <small key={source.id}>
                                                    {source.section} · {source.file}
                                                    {source.page ? ' · tr. ' + source.page : ''}
                                                </small>
                                            ))}
                                            {message.sources.length > 2 && (
                                                <details className="chat-more-sources">
                                                    <summary>
                                                        Xem thêm {message.sources.length - 2} mục
                                                    </summary>
                                                    {message.sources.slice(2).map((source) => (
                                                        <small key={source.id}>
                                                            {source.section} · {source.file}
                                                            {source.page
                                                                ? ' · tr. ' + source.page
                                                                : ''}
                                                        </small>
                                                    ))}
                                                </details>
                                            )}
                                        </div>
                                    )}
                                    {message.dataSources?.length > 0 && (
                                        <div className="chat-data-sources">
                                            <span>NGUỒN THỰC TẾ DÙNG TRONG CÂU TRẢ LỜI</span>
                                            {message.dataSources.slice(0, 2).map((source) => (
                                                <a
                                                    key={source.url}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <b>{source.publisher}</b>
                                                    <small>{source.title}</small>
                                                </a>
                                            ))}
                                            {message.dataSources.length > 2 && (
                                                <details className="chat-more-sources">
                                                    <summary>
                                                        Xem thêm {message.dataSources.length - 2}{' '}
                                                        nguồn
                                                    </summary>
                                                    {message.dataSources.slice(2).map((source) => (
                                                        <a
                                                            key={source.url}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <b>{source.publisher}</b>
                                                            <small>{source.title}</small>
                                                        </a>
                                                    ))}
                                                </details>
                                            )}
                                        </div>
                                    )}
                                    {message.grounded === false &&
                                        message.textbookChecked &&
                                        message.role === 'assistant' && (
                                            <small className="chat-fallback">
                                                CHƯA TÌM THẤY ĐOẠN GIÁO TRÌNH KHỚP TRỰC TIẾP
                                            </small>
                                        )}
                                    {message.fallback && message.sources?.length > 0 && (
                                        <small className="chat-fallback">
                                            CÂU TRẢ LỜI DỰ PHÒNG TỪ NỘI DUNG ĐÃ TÌM THẤY
                                        </small>
                                    )}
                                </div>
                            ))}
                            {busy && (
                                <div className="chat-turn assistant">
                                    <div className="typing-indicator">
                                        <i />
                                        <i />
                                        <i />
                                    </div>
                                    <small>ĐANG ĐỐI CHIẾU GIÁO TRÌNH</small>
                                </div>
                            )}
                        </div>
                        {messages.length === 1 && (
                            <div className="chat-starters">
                                {[
                                    'Giai cấp công nhân là ai?',
                                    'Sứ mệnh lịch sử của giai cấp công nhân là gì?',
                                    'Sứ mệnh ấy có những mặt nào?',
                                ].map((question) => (
                                    <button
                                        key={question}
                                        onClick={(event) => submit(event, question)}
                                    >
                                        {question}
                                        <ArrowUpRight size={14} />
                                    </button>
                                ))}
                            </div>
                        )}
                        <form className="chat-form" onSubmit={(event) => submit(event)}>
                            <label className="sr-only" htmlFor="chat-question">
                                Câu hỏi môn MLN131
                            </label>
                            <textarea
                                id="chat-question"
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Bạn muốn hỏi điều gì trong môn MLN131?"
                                rows={2}
                                maxLength={1000}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || busy}
                                aria-label="Gửi câu hỏi"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <div className="chat-footer">
                            Khi tài liệu chưa đủ, hãy xem các mục nguồn hoặc thử hỏi bằng một khái
                            niệm trong sách.
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

function Footer({ onAsk }) {
    return (
        <>
            <section className="closing-callout">
                <div className="closing-spark">
                    <Sparkles size={22} />
                </div>
                <div>
                    <span>HỌC TỪ SÁCH · HIỂU TỪ ĐỜI SỐNG</span>
                    <h2>
                        Điều gì thay đổi khi ta
                        <br />
                        <em>nhìn thấy người lao động?</em>
                    </h2>
                    <p>
                        Tiếp tục khám phá, đặt câu hỏi và tự nối lý luận với những gì đang diễn ra
                        quanh mình.
                    </p>
                </div>
                <button onClick={onAsk}>
                    MỞ GÓC HỎI BÀI <ArrowUpRight size={15} />
                </button>
            </section>
            <footer className="site-footer">
                <a className="footer-brand" href="#top">
                    <span className="brand-mark">
                        <Waves size={19} />
                    </span>
                    <span>
                        MẠCH MEKONG<small>LAO ĐỘNG · SẢN XUẤT · ĐỒNG BẰNG</small>
                    </span>
                </a>
                <div className="footer-purpose">
                    <span>MỘT KHÔNG GIAN HỌC MLN131</span>
                    <p>
                        Dùng tình huống ở năm địa phương để cùng tìm hiểu giai cấp công nhân và vai
                        trò của người lao động trong sản xuất.
                    </p>
                </div>
                <a className="footer-top" href="#top">
                    VỀ ĐẦU TRANG <ArrowUpRight size={14} />
                </a>
                <div className="footer-line">
                    <span>GIÁO TRÌNH + TÀI LIỆU ĐỊA PHƯƠNG</span>
                    <span>HỌC ĐỂ HIỂU · HIỂU ĐỂ LIÊN HỆ</span>
                </div>
            </footer>
        </>
    );
}

export default function App() {
    const [chatOpen, setChatOpen] = useState(false);
    const [initialQuestion, setInitialQuestion] = useState('');
    const [chatContext, setChatContext] = useState(null);

    function openChat(question, context) {
        setInitialQuestion(question || '');
        if (context) setChatContext(context);
        setChatOpen(true);
    }

    function explore() {
        document.getElementById('atlas')?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <>
            <Header onAsk={() => openChat()} />
            <main>
                <Hero onExplore={explore} />
                <div className="thesis-strip">
                    <span>✳</span>
                    <p>
                        Một nghề có thể gồm nhiều kiểu lao động.
                        <br />
                        <em>Muốn hiểu đúng, hãy nhìn vào quan hệ sản xuất.</em>
                    </p>
                    <small>
                        MẠCH MEKONG
                        <br />
                        MLN131 · 2026
                    </small>
                </div>
                <AtlasExplorer onAsk={openChat} onContextChange={setChatContext} />
                <CentralQuestion onAsk={openChat} />
                <TextbookRoom />
                <IdeaLab />
                <Footer onAsk={() => openChat()} />
            </main>
            <button className="floating-ask" onClick={() => openChat()} aria-label="Mở góc hỏi bài">
                <span className="floating-pulse" />
                <Bot size={19} />
                <span>HỎI BÀI</span>
            </button>
            <ChatDrawer
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                initialQuestion={initialQuestion}
                studyContext={chatContext}
            />
        </>
    );
}
