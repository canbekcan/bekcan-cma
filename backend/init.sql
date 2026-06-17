-- Initialize Database Schema for Multi-Tenant Conference System

CREATE TABLE conferences (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    venue_info TEXT,
    wifi_ssid VARCHAR(100),
    wifi_wpa VARCHAR(100),
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'organizer', -- 'superadmin', 'organizer'
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE speakers (
    id SERIAL PRIMARY KEY,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    speaker_ref VARCHAR(100) NOT NULL, -- e.g., 'sp1' from original JSON
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    institution VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conference_id, speaker_ref)
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    session_ref VARCHAR(100) NOT NULL, -- e.g., 's1' from original JSON
    title_tr VARCHAR(255),
    title_en VARCHAR(255),
    description_tr TEXT,
    description_en TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    room VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conference_id, session_ref)
);

CREATE TABLE session_speakers (
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_id INTEGER REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, speaker_id)
);

CREATE TABLE attendees (
    device_id UUID NOT NULL,
    conference_id INTEGER REFERENCES conferences(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    institution VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, conference_id)
);

-- Insert Default Super Admin (password: admin123 -> you should change this later)
-- Using bcrypt hash for 'admin123'
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$wE/.7x41L6Jb9iXhGWe5wObiZ8xO8s.RQKz3B/5E1bC6qO0r1G4sW', 'superadmin');

-- ==============================================
-- SEED DATA FROM SCHEDULE.JSON
-- ==============================================
INSERT INTO conferences (slug, name, start_date, end_date, venue_info, wifi_ssid, wifi_wpa, logo_url) 
VALUES ('bekcan2026', 'CRCP 2026 Konferansı', '2026-06-17', '2026-06-19', 'İstanbul Kongre Merkezi', 'BEKCAN_WIFI', 'bekcan_welcome', 'https://bekcan.com/uploads/default/original/1X/d463e22bb7c3c345f7b1c32c8a12a473a500ff7d.png')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp1', 'Prof. Dr. Aylin Yılmaz', 'Yapay Zeka Enstitüsü Direktörü', 'Doğu Akdeniz Üniversitesi', 'aylin.yilmaz@emu.edu.tr', 'Prof. Dr. Aylin Yılmaz, yapay zeka, derin öğrenme ve veri madenciliği alanında öncü çalışmalara imza atmıştır. Doğu Akdeniz Üniversitesi''nde (EMU) araştırma grubu lideridir.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp2', 'Mert Demir', 'Kıdemli Web Tasarım Mimarı', 'WebTech Çözümleri', 'mert.demir@webtech.com', 'Mert Demir, büyük ölçekli modern web mimarileri, Progressive Web Apps (PWA) ve web performans optimizasyonu konularında 12 yıllık sektörel tecrübeye sahiptir.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp3', 'Volkan Şen', 'Kıdemli Mobil Geliştirici', 'AppNation Ltd.', 'volkan@appnation.io', 'Volkan Şen, React Native, Swift ve Flutter ile native/hibrit mobil yazılım ekosistemlerinde çalışmaktadır. Birçok küresel uygulamada imzası bulunur.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp4', 'Zeynep Kaya', 'UI/UX Tasarım Lideri', 'Studio Pixel', 'zeynep@studiopixel.com', 'Zeynep Kaya, insan odaklı tasarım, mobil etkileşim dinamikleri ve kullanılabilirlik testleri konularında uzmanlaşmış ödüllü bir tasarımcıdır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp5', 'Kaan Arslan', 'Kıdemli Arayüz Tasarımcısı', 'Studio Pixel', 'kaan.arslan@studiopixel.com', 'Kaan Arslan, Figma ekosistemi, tasarım sistemleri (Design Systems) ve mikro-etkileşim prototipleme üzerine çalışmalar yürütmektedir.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp6', 'Oğuzhan Çelik', 'Siber Güvenlik Danışmanı', 'SiberKalkan Güvenlik', 'oguzhan@cybershield.com', 'Oğuzhan Çelik, sızma testleri, güvenli yazılım geliştirme yaşam döngüsü (DevSecOps) ve web güvenliği konularında uzmanlaşmış etik hacker''dır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp7', 'Alper Kurt', 'Kıdemli Güvenlik Analisti', 'SiberKalkan Güvenlik', 'alper.kurt@cybershield.com', 'Alper Kurt, mobil işletim sistemleri (iOS/Android) güvenlik zaafiyetleri ve API uç noktası koruma mimarileri üzerine uzmanlaşmıştır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp8', 'Elif Şahin', 'Bulut Çözümleri Mimarı', 'CloudOps Sistemleri', 'elif@cloudops.com', 'Elif Şahin, AWS ve Azure altyapılarında yüksek erişilebilirlikli mikroservis mimarileri tasarlamakta ve DevOps otomasyonları kurmaktadır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp9', 'Hakan Bal', 'Konteyner Teknolojileri Uzmanı', 'CloudOps Sistemleri', 'hakan.bal@cloudops.com', 'Hakan Bal, Kubernetes, Docker ve Service Mesh mimarileriyle bulut yerel (Cloud Native) sistemlerin orkestrasyonu üzerine çalışmaktadır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp10', 'Canan Ekinci', 'Girişim Hızlandırıcı Yöneticisi', 'TeknoGirişim Vakfı', 'canan.ekinci@technostart.org', 'Canan Ekinci, erken aşama teknoloji girişimlerinin ölçeklenmesi, mentorluk ağları ve risk sermayesi (VC) yatırımları konularında danışmanlık yapmaktadır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp11', 'Dr. Murat Aktaş', 'Veri Bilimci & Akademisyen', 'Doğu Akdeniz Üniversitesi', 'murat.aktas@emu.edu.tr', 'Dr. Murat Aktaş, büyük veri, tahmine dayalı analitik ve doğal dil işleme (NLP) üzerine araştırmalar yürütmekte ve sektörel projeler danışmanlığı yapmaktadır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp12', 'Hakan Yılmaz', 'Kıdemli Arayüz Geliştirici', 'CodeCraft Teknoloji', 'hakan@codecraft.io', 'Hakan Yılmaz, modern JS frameworkleri, build araçları (Vite/Rollup) ve web standartları üzerine teknik yayınlar yazan bir yazılımcıdır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp13', 'Barış Öz', 'API & Altyapı Geliştirici', 'CodeCraft Teknoloji', 'baris.oz@codecraft.io', 'Barış Öz, TypeScript tabanlı güvenli API tasarımı, şema doğrulama ve gerçek zamanlı haberleşme protokolleri konularında uzmanlaşmıştır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp14', 'Selin Tan', 'DevOps Mühendisi', 'DevOpsWorks', 'selin.tan@devopsworks.com', 'Selin Tan, CI/CD boru hatları otomasyonu, GitOps pratikleri ve altyapı kodlama (IaC) teknolojileri üzerine uzmanlaşmıştır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp15', 'Tarık Can', 'Sistem Yönetim Lideri', 'SistemNet Telekom', 'tarik@systemnet.com', 'Tarık Can, Linux sunucu yönetimi, sanallaştırma altyapıları ve konteyner güvenliği denetimleri konularında uzmanlaşmıştır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, bio, avatar_url) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 'sp16', 'Arda Şen', 'Web3 & Akıllı Sözleşme Geliştirici', 'EtherBlock Labs', 'arda@etherblock.io', 'Arda Şen, Ethereum sanal makinesi (EVM), Solidity diliyle akıllı sözleşmeler ve merkeziyetsiz finans (DeFi) entegrasyonu üzerine çalışmaktadır.', '')
ON CONFLICT (conference_id, speaker_ref) DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's1', 'Kayıt ve Sabah İkramları', 'Registration & Morning Coffee', 'Konferans girişi, katılımcı kayıtlarının yapılması, yaka kartı dağıtımı ve lobi alanında sabah kahve ikramı.', 'Conference check-in, registration, badge pickup, and welcoming morning coffee in the lobby area.', '2026-06-17T08:30:00+03:00', '2026-06-17T09:00:00+03:00', 'Lobi / Lobby', 'Welcome')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's2', 'Açılış Oturumu: Yapay Zeka Çağında Yazılım Geliştirme', 'Opening Keynote: Software Development in the Age of AI', 'Yapay zeka asistanlarının ve kod üreticilerinin yazılım mühendisliği üzerindeki devrimsel etkileri, iş süreçlerindeki değişimler ve geleceğin geliştirici profili üzerine değerlendirmeler.', 'Revolutionary effects of AI assistants and code generators on software engineering, shifts in business workflows, and assessments on the developer profiles of the future.', '2026-06-17T09:00:00+03:00', '2026-06-17T09:45:00+03:00', 'Büyük Salon / Main Hall', 'Keynote')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's2'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp1')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's3', 'PWA ve Modern Web Standartları', 'PWA and Modern Web Standards', 'Modern web API''leri kullanarak çevrimdışı çalışabilen, yüksek performanslı ve uygulama mağazalarından bağımsız kurulabilir Progressive Web Apps (PWA) geliştirme süreçleri ve en iyi örnekler.', 'Development processes and best practices for Progressive Web Apps (PWA) that work offline, deliver high performance, and install independently of app stores using modern web APIs.', '2026-06-17T10:00:00+03:00', '2026-06-17T11:00:00+03:00', 'Salon A / Hall A', 'Web Dev')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's3'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp2')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's16', 'React Native ile Hibrit Mobil Uygulamalar', 'Hybrid Mobile Apps with React Native', 'React Native kullanarak tek bir JavaScript/TypeScript kod tabanından hem iOS hem de Android işletim sistemleri için yüksek performanslı ve native görünümlü mobil uygulamaların inşası.', 'Building high-performance and native-looking mobile applications for both iOS and Android operating systems from a single JavaScript/TypeScript codebase using React Native.', '2026-06-17T10:00:00+03:00', '2026-06-17T11:00:00+03:00', 'Salon B / Hall B', 'Mobile')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's16'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp3')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's22', 'Yapay Zeka ve Etik', 'AI and Ethics', 'Yapay zeka sistemlerinin karar verme süreçlerindeki etik sorunlar ve taraflı algoritmaların etkileri.', 'Ethical issues in AI decision making and the impact of biased algorithms.', '2026-06-17T10:00:00+03:00', '2026-06-17T11:00:00+03:00', 'Salon C / Hall C', 'Data Science')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's22'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp4')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's23', 'Sürdürülebilir Yazılım Geliştirme', 'Sustainable Software Development', 'Karbon ayak izini azaltan çevre dostu yazılım mimarileri ve sunucu optimizasyonları.', 'Eco-friendly software architectures and server optimizations reducing carbon footprint.', '2026-06-17T10:00:00+03:00', '2026-06-17T11:00:00+03:00', 'Salon D / Hall D', 'Cloud')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's23'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp8')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's4', 'Mobil Kullanıcı Deneyimi (UX) Tasarımı', 'Mobile User Experience (UX) Design', 'Mobil ekran sınırlamaları altında kullanıcı dostu arayüzler tasarlama teknikleri, mikro-etkileşimler, erişilebilirlik standartları ve kullanıcı akışları oluşturma stratejileri.', 'Techniques for designing user-friendly interfaces under mobile screen constraints, micro-interactions, accessibility standards, and strategies for creating user flows.', '2026-06-17T11:15:00+03:00', '2026-06-17T12:15:00+03:00', 'Salon A / Hall A', 'UI/UX')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's4'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp4')
) ON CONFLICT DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's4'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp5')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's17', 'Figma ile Gelişmiş Prototipleme', 'Advanced Prototyping with Figma', 'Figma''nın yeni değişkenler (variables), koşullu mantık (conditional logic) ve gelişmiş geçiş özellikleri kullanılarak tasarım aşamasında kodlama hissi veren prototiplerin hazırlanması.', 'Preparing prototypes that feel like coded applications during the design phase using Figma''s new variables, conditional logic, and advanced transition features.', '2026-06-17T11:15:00+03:00', '2026-06-17T12:15:00+03:00', 'Salon B / Hall B', 'UI/UX')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's17'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp5')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's5', 'Öğle Yemeği Arası', 'Lunch Break', 'Katılımcılar için ana restoranda sunulan açık büfe öğle yemeği ve serbest networking saati.', 'Open buffet lunch provided in the main restaurant for attendees and casual networking hour.', '2026-06-17T12:15:00+03:00', '2026-06-17T13:30:00+03:00', 'Restoran / Restaurant', 'Break')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's6', 'Güvenli Kodlama ve Web Güvenliği', 'Secure Coding and Web Security', 'Web uygulamalarında yaygın görülen XSS, SQL Injection ve CSRF gibi güvenlik açıklarının kod seviyesinde önlenmesi, güvenli başlıklar ve modern web güvenlik standartları.', 'Preventing common web vulnerabilities like XSS, SQL Injection, and CSRF at the code level, implementing secure headers, and applying modern web security standards.', '2026-06-17T13:30:00+03:00', '2026-06-17T14:30:00+03:00', 'Salon A / Hall A', 'Security')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's6'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp6')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's18', 'OWASP Mobile En İyi Güvenlik Uygulamaları', 'OWASP Mobile Top Security Practices', 'Mobil cihazların kendine özgü veri saklama ve API haberleşmesi riskleri, OWASP Mobile Top 10 listesi üzerinden pratik korunma yöntemleri ve mobil şifreleme pratikleri.', 'Unique data storage and API communication risks on mobile devices, practical protection methods based on the OWASP Mobile Top 10 list, and mobile encryption practices.', '2026-06-17T13:30:00+03:00', '2026-06-17T14:30:00+03:00', 'Salon B / Hall B', 'Security')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's18'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp7')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's7', 'Bulut Bilişim ve Sunucusuz Mimari', 'Cloud Computing and Serverless Architecture', 'Geleneksel sunucu yönetim yükünü azaltan Sunucusuz (Serverless) mimarilerin çalışma prensipleri, AWS Lambda / Azure Functions kullanımı, ölçeklenebilirlik ve maliyet optimizasyonları.', 'Working principles of Serverless architectures that reduce traditional server administration overhead, deploying AWS Lambda / Azure Functions, scalability, and cost optimization.', '2026-06-17T14:45:00+03:00', '2026-06-17T15:45:00+03:00', 'Salon A / Hall A', 'Cloud')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's7'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp8')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's19', 'Kubernetes ile Konteyner Yönetimi', 'Container Orchestration with Kubernetes', 'Mikroservislerin Docker konteynerleri üzerinde çalıştırılması, Kubernetes pod yapılandırmaları, otomatik ölçekleme (autoscaling), yük dengeleme ve zero-downtime deployment teknikleri.', 'Running microservices on Docker containers, Kubernetes pod configurations, autoscaling, load balancing, and zero-downtime deployment techniques.', '2026-06-17T14:45:00+03:00', '2026-06-17T15:45:00+03:00', 'Salon B / Hall B', 'Cloud')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's19'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp9')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's8', 'Kahve Arası', 'Coffee Break', 'Çay, kahve ve tatlı ikramları eşliğinde oturumlar arası dinlenme ve mini sergi alanlarında networking zamanı.', 'A brief rest between sessions with tea, coffee, and dessert refreshments, along with networking in the mini exhibition areas.', '2026-06-17T15:45:00+03:00', '2026-06-17T16:15:00+03:00', 'Lobi / Lobby', 'Break')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's9', 'Panel: Türkiye''de Girişimcilik ve Teknoloji Yatırımları', 'Panel: Entrepreneurship and Tech Investments in Turkey', 'Türkiye''deki teknoloji ekosisteminin mevcut durumu, startup kurucularının büyüme deneyimleri, melek yatırımcılık ve girişim sermayesi fonlarının gelecekteki yatırım alanları.', 'The current state of the tech ecosystem in Turkey, growth experiences of startup founders, angel investing, and future investment sectors of venture capital funds.', '2026-06-17T16:15:00+03:00', '2026-06-17T17:15:00+03:00', 'Büyük Salon / Main Hall', 'Panel')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's9'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp10')
) ON CONFLICT DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's9'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp1')
) ON CONFLICT DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's9'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp4')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's10', '2. Gün Açılış Oturumu: Veri Analitiği ve Büyük Veri', 'Day 2 Opening Keynote: Data Analytics and Big Data', 'Büyük veri analitiğinin işletmelerdeki stratejik önemi, veri gölleri, tahmine dayalı analitik modelleri ve büyük verinin makine öğrenimi süreçlerine entegrasyonu.', 'Strategic importance of big data analytics in enterprises, data lakes, predictive analytical models, and integrating big data with machine learning workflows.', '2026-06-18T09:00:00+03:00', '2026-06-18T10:00:00+03:00', 'Büyük Salon / Main Hall', 'Data Science')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's10'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp11')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's11', 'JavaScript Dünyasındaki Yeni Trendler', 'New Trends in the JavaScript Ecosystem', 'JavaScript ekosistemindeki güncel değişimler, Vite ve Bun gibi modern araçların getirdiği performans artışları, SSR mimarileri ve ECMAScript standartlarındaki yenilikler.', 'Current changes in the JavaScript ecosystem, performance increases brought by modern tools like Vite and Bun, SSR architectures, and updates in ECMAScript standards.', '2026-06-18T10:15:00+03:00', '2026-06-18T11:15:00+03:00', 'Salon A / Hall A', 'Web Dev')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's11'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp12')
) ON CONFLICT DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's11'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp2')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's20', 'TypeScript ile Tip Güvenli API Tasarımı', 'Type-Safe API Design with TypeScript', 'API tasarımında TypeScript tipleriyle bütünleşik doğrulama katmanları oluşturma, Zod kütüphanesi ile çalışma zamanı tip kontrolü ve istemci-sunucu arası tip paylaşımı.', 'Creating validation layers integrated with TypeScript types in API design, runtime type checking with the Zod library, and type sharing between client and server.', '2026-06-18T10:15:00+03:00', '2026-06-18T11:15:00+03:00', 'Salon B / Hall B', 'Web Dev')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's20'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp13')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's12', 'DevOps ve CI/CD Süreçleri', 'DevOps and CI/CD Pipelines', 'Yazılım teslim süreçlerini hızlandıran sürekli entegrasyon ve sürekli dağıtım (CI/CD) boru hatları tasarlama, GitHub Actions ve GitLab CI ile otomatik test/dağıtım süreçleri.', 'Designing continuous integration and continuous deployment (CI/CD) pipelines that speed up software delivery, automating test/deploy flows with GitHub Actions and GitLab CI.', '2026-06-18T11:30:00+03:00', '2026-06-18T12:30:00+03:00', 'Salon A / Hall A', 'DevOps')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's12'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp14')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's21', 'Dockerize Uygulamalar ve Konteyner Güvenliği', 'Dockerizing Applications & Container Security', 'Uygulamaları Dockerfile ile güvenli ve optimize şekilde paketleme, multi-stage build teknikleri, minimal base image kullanımı ve konteyner tarama araçlarıyla zafiyet analizi.', 'Packaging applications securely and optimally using Dockerfile, multi-stage build techniques, using minimal base images, and vulnerability analysis with container scanning tools.', '2026-06-18T11:30:00+03:00', '2026-06-18T12:30:00+03:00', 'Salon B / Hall B', 'DevOps')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's21'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp15')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's13', 'Öğle Yemeği Arası', 'Lunch Break', '2. gün için ana restoranda sunulan açık büfe öğle yemeği ve serbest networking saati.', 'Open buffet lunch provided in the main restaurant for day 2 and casual networking hour.', '2026-06-18T12:30:00+03:00', '2026-06-18T14:00:00+03:00', 'Restoran / Restaurant', 'Break')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's14', 'Blokzincir ve Web3 Teknolojileri', 'Blockchain and Web3 Technologies', 'Merkeziyetsiz internet mimarisi, Solidity ile akıllı sözleşmeler yazma prensipleri, DeFi protokolleri, Web3 cüzdan entegrasyonları ve dApp geliştirme pratikleri.', 'Decentralized web architecture, principles of writing smart contracts with Solidity, DeFi protocols, Web3 wallet integrations, and practices for dApp development.', '2026-06-18T14:00:00+03:00', '2026-06-18T15:00:00+03:00', 'Salon A / Hall A', 'Web3')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's14'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp16')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's15', 'Kapanış Paneli: 2030''a Doğru Teknoloji Dünyası', 'Closing Panel: Tech World Towards 2030', 'Gelecek 10 yılda hayatımızı değiştirecek yıkıcı teknolojiler, yapay zekanın gelecekteki rolü, insan-makine etkileşimi ve konferansın genel kapanış değerlendirmesi.', 'Disruptive technologies that will change our lives in the next 10 years, future role of AI, human-machine interaction, and overall closing assessment of the conference.', '2026-06-18T15:15:00+03:00', '2026-06-18T16:15:00+03:00', 'Büyük Salon / Main Hall', 'Panel')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's15'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp1')
) ON CONFLICT DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's15'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp2')
) ON CONFLICT DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's15'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp8')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's24', '3. Gün Açılış: Geleceğin Arayüzleri', 'Day 3 Keynote: Interfaces of the Future', 'AR/VR ve beyin-bilgisayar arayüzleri gibi yeni nesil etkileşim teknolojileri.', 'Next generation interaction technologies like AR/VR and brain-computer interfaces.', '2026-06-19T09:00:00+03:00', '2026-06-19T10:00:00+03:00', 'Büyük Salon / Main Hall', 'UI/UX')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's24'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp5')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's25', 'Kriptografi ve Kuantum Güvenliği', 'Cryptography and Quantum Security', 'Kuantum bilgisayarların mevcut şifreleme yöntemlerine tehdidi ve kuantum sonrası kriptografi.', 'The threat of quantum computers to current encryption and post-quantum cryptography.', '2026-06-19T10:15:00+03:00', '2026-06-19T11:15:00+03:00', 'Salon A / Hall A', 'Security')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's25'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp6')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's26', 'Web3 ve Merkeziyetsiz Kimlik', 'Web3 and Decentralized Identity', 'Blokzincir tabanlı kimlik doğrulama sistemleri ve veri sahipliği.', 'Blockchain-based identity verification systems and data ownership.', '2026-06-19T10:15:00+03:00', '2026-06-19T11:15:00+03:00', 'Salon B / Hall B', 'Web3')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's26'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp16')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's27', 'Rust ile Yüksek Performanslı Sistemler', 'High Performance Systems with Rust', 'Rust programlama dili ile bellek güvenliği ve sistem seviyesi yazılım geliştirme.', 'Memory safety and system-level software development with the Rust programming language.', '2026-06-19T10:15:00+03:00', '2026-06-19T11:15:00+03:00', 'Salon C / Hall C', 'Web Dev')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's27'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp13')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's28', 'Mikro Önyüz (Micro-Frontend) Mimarisi', 'Micro-Frontend Architecture', 'Büyük ölçekli web uygulamalarını bağımsız ekiplerin yönetebileceği mikro önyüz parçalarına ayırma.', 'Decomposing large-scale web apps into micro-frontends manageable by independent teams.', '2026-06-19T10:15:00+03:00', '2026-06-19T11:15:00+03:00', 'Salon D / Hall D', 'Web Dev')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's28'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp12')
) ON CONFLICT DO NOTHING;
INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) 
VALUES ((SELECT id FROM conferences WHERE slug = 'bekcan2026'), 's29', 'Ödül Töreni ve Kapanış', 'Award Ceremony and Closing', 'Konferansın en iyi sunumlarına ödüllerinin verilmesi ve resmi kapanış.', 'Awarding the best presentations of the conference and official closing.', '2026-06-19T11:30:00+03:00', '2026-06-19T12:30:00+03:00', 'Büyük Salon / Main Hall', 'Panel')
ON CONFLICT (conference_id, session_ref) DO NOTHING;
INSERT INTO session_speakers (session_id, speaker_id) 
VALUES (
  (SELECT id FROM sessions WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND session_ref = 's29'),
  (SELECT id FROM speakers WHERE conference_id = (SELECT id FROM conferences WHERE slug = 'bekcan2026') AND speaker_ref = 'sp1')
) ON CONFLICT DO NOTHING;
