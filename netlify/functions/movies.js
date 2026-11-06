
exports.handler = async function () {
    try {
        const apiKey = process.env.TMDB_API_KEY;

        if (!apiKey) {
            throw new Error("Chưa cấu hình TMDB API Key.");
        }

        const url = new URL(
            "https://api.themoviedb.org/3/movie/now_playing"
        );

        url.searchParams.set("api_key", apiKey);
        url.searchParams.set("language", "vi-VN");
        url.searchParams.set("region", "VN");

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu phim từ TMDB.");
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300"
            },
            body: JSON.stringify(data.results || [])
        };

    } catch (error) {
        console.error("Lỗi API phim:", error.message);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Không thể tải danh sách phim."
            })
        };
    }
};
