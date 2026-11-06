
exports.handler = async function () {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabasePublishableKey =
        process.env.SUPABASE_PUBLISHABLE_KEY || "";

    if (!supabaseUrl || !supabasePublishableKey) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Thiếu cấu hình Supabase."
            })
        };
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },
        body: JSON.stringify({
            supabaseUrl,
            supabasePublishableKey
        })
    };
};
