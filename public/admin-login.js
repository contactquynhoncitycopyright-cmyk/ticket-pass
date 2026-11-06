
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const loginForm = document.getElementById("admin-login-form");
const loginMessage = document.getElementById("login-message");

async function initAdminLogin() {
    try {
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Không lấy được cấu hình Supabase.");
        }

        const config = await response.json();

        const supabase = createClient(
            config.supabaseUrl,
            config.supabasePublishableKey
        );

        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            const email = document
                .getElementById("admin-username")
                .value.trim();

            const password = document
                .getElementById("admin-password")
                .value;

            loginMessage.textContent = "Đang kiểm tra...";
            loginMessage.style.color = "#ffffff";

            try {
                // Đăng nhập Supabase
                const { data, error } =
                    await supabase.auth.signInWithPassword({
                        email,
                        password
                    });

                if (error) throw error;

                // Kiểm tra quyền Admin
                const { data: admin, error: adminError } =
                    await supabase
                        .from("admin_users")
                        .select("user_id")
                        .eq("user_id", data.user.id)
                        .maybeSingle();

                if (adminError) throw adminError;

                if (!admin) {
                    await supabase.auth.signOut();
                    throw new Error("Tài khoản này không có quyền Admin.");
                }

                loginMessage.textContent = "Đăng nhập thành công!";
                loginMessage.style.color = "#55dd88";

                window.location.href = "admin.html";

            } catch (error) {
                console.error("Lỗi đăng nhập Admin:", error);

                loginMessage.textContent =
                    error.message || "Đăng nhập thất bại.";

                loginMessage.style.color = "#ff5555";
            }
        });

    } catch (error) {
        console.error("Lỗi khởi tạo Admin Login:", error);
        loginMessage.textContent = "Không thể kết nối Supabase.";
        loginMessage.style.color = "#ff5555";
    }
}

initAdminLogin();
