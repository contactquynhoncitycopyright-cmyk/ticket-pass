// IMPORT THƯ VIỆN
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// ĐỌC FILE .ENV
dotenv.config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();

console.log(
    "Supabase URL hợp lệ:",
    /^https?:\/\//i.test(supabaseUrl)
);

const supabase = createClient(supabaseUrl, supabaseKey);
console.log(
    "Supabase:",
    process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
        ? "ĐÃ CẤU HÌNH"
        : "CHƯA CẤU HÌNH"
);
console.log(
    "TMDB API Key:",
    process.env.TMDB_API_KEY ? "ĐÃ NHẬN" : "CHƯA NHẬN"
);

const app = express();
const PORT = process.env.PORT || 3000;

// CHO PHÉP ĐỌC JSON
app.use(express.json());
// Cung cấp cấu hình Supabase công khai cho website
app.get("/api/config", (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY
    });
});

// HIỂN THỊ WEBSITE
app.use(express.static(__dirname));

// API LẤY DANH SÁCH PHIM ĐANG CHIẾU
app.get("/api/movies", async (req, res) => {
    try {
        const response = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${encodeURIComponent(process.env.TMDB_API_KEY)}&language=vi-VN&region=VN`
);
        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu phim từ TMDB");
        }

        const data = await response.json();

        res.json(data.results);

    } catch (error) {
        console.error("Lỗi API:", error.message);
        res.status(500).json({
            message: "Không thể tải danh sách phim."
        });
    }
});

// KHỞI ĐỘNG SERVER
app.listen(PORT, () => {
    console.log(`TICKET PASS đang chạy tại http://localhost:${PORT}`);
});