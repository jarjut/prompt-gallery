# SQLite Embedded dengan FTS5 untuk Penyimpanan dan Pencarian

Untuk 15.601 baris dataset prompt yang bersifat read-heavy, kami menggunakan SQLite lokal (`better-sqlite3`) dengan virtual table FTS5 langsung di dalam runtime Next.js, bukan database terpisah (PostgreSQL/Supabase) atau search engine eksternal (Meilisearch/Elasticsearch). Keputusan ini memangkas biaya operasional menjadi nol dan memberikan latensi pencarian di bawah 1 milidetik, dengan konsekuensi write-concurrency terbatas dan aplikasi harus di-host pada container/VPS persisten (bukan serverless edge statis tanpa filesystem).
