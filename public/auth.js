

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function initAuth() {
    try {
        // 1. LẤY CẤU HÌNH SUPABASE
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Không lấy được cấu hình Supabase.");
        }

        const config = await response.json();

        if (!config.supabaseUrl || !config.supabasePublishableKey) {
            throw new Error("Thiếu thông tin cấu hình Supabase.");
        }

        const supabase = createClient(
            config.supabaseUrl,
            config.supabasePublishableKey
        );

        window.ticketPassSupabase = supabase;
        window.dispatchEvent(new Event("ticket-pass-supabase-ready"));

        console.log("Supabase Auth: ĐÃ KẾT NỐI");

        // 2. LẤY CÁC PHẦN TỬ HTML
        const popup = document.getElementById("auth-popup");
        const openButton = document.getElementById("open-auth");
        const closeButton = document.getElementById("close-auth");
        const form = document.getElementById("auth-form");
        const switchButton = document.getElementById("auth-switch");
        const title = document.getElementById("auth-title");
        const description = document.getElementById("auth-description");
        const submitButton = document.getElementById("auth-submit");
        const message = document.getElementById("auth-message");
        const switchText = document.getElementById("auth-switch-text");
        const passwordInput = document.getElementById("auth-password");
        const displayNameInput = document.getElementById("auth-display-name");
        const emailInput = document.getElementById("auth-email");

        // Các phần tử hồ sơ sẽ được thêm vào index.html ở bước sau
        const profilePopup = document.getElementById("profile-popup");
        const profileButton = document.getElementById("open-profile");
        const profileClose = document.getElementById("close-profile");
        const profileForm = document.getElementById("profile-form");
        const profileNameInput = document.getElementById("profile-display-name");
        const avatarInput = document.getElementById("profile-avatar");
        const profileMessage = document.getElementById("profile-message");

        let mode = "login";
        let currentUser = null;
        let currentProfile = null;

        // 3. HIỂN THỊ THÔNG BÁO
        function showMessage(text, success = false) {
            if (!message) return;

            message.textContent = text;
            message.style.color = success ? "#4ade80" : "#ff7777";
        }

        function showProfileMessage(text, success = false) {
            if (!profileMessage) return;

            profileMessage.textContent = text;
            profileMessage.style.color = success ? "#4ade80" : "#ff7777";
        }

        // 4. CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ
        function setMode(newMode) {
            mode = newMode;

            showMessage("");

            if (!displayNameInput) return;

            displayNameInput.style.display =
                mode === "signup" ? "block" : "none";

            displayNameInput.required = mode === "signup";

            if (mode === "login") {
                title.textContent = "Đăng nhập";
                description.textContent =
                    "Chào mừng bạn quay trở lại TICKET PASS!";

                submitButton.textContent = "ĐĂNG NHẬP";
                switchText.textContent = "Chưa có tài khoản?";
                switchButton.textContent = "Đăng ký ngay";

                passwordInput.autocomplete = "current-password";
            } else {
                title.textContent = "Tạo tài khoản";
                description.textContent =
                    "Tham gia cộng đồng TICKET PASS ngay hôm nay!";

                submitButton.textContent = "ĐĂNG KÝ";
                switchText.textContent = "Đã có tài khoản?";
                switchButton.textContent = "Đăng nhập";

                passwordInput.autocomplete = "new-password";
            }
        }

        // 5. TẢI HỒ SƠ THÀNH VIÊN
        async function loadUserProfile(user) {
            const { data, error } = await supabase
                .from("profiles")
                .select("user_id, display_name, avatar_url")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) {
                console.error("Lỗi tải hồ sơ:", error.message);
                return null;
            }

            currentProfile = data;

            if (data) {
                console.log("Hồ sơ thành viên:", data.display_name);
            }

            window.ticketPassCurrentProfile = data;

            window.dispatchEvent(
                new CustomEvent("ticketpass-profile-updated", {
                    detail: data
                })
            );

            return data;
        }

        // 6. CẬP NHẬT GIAO DIỆN TÀI KHOẢN
        function updateAuthUI(session) {
            currentUser = session?.user || null;

            if (openButton) {
                openButton.textContent =
                    session ? "Đăng xuất" : "Đăng nhập";
            }

            if (profileButton) {
                profileButton.style.display =
                    session ? "inline-flex" : "none";
            }

            if (!session) {
                currentProfile = null;
                window.ticketPassCurrentProfile = null;
            }
        }

        // 7. MỞ / ĐÓNG ĐĂNG NHẬP
        if (openButton) {
            openButton.addEventListener("click", async () => {
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    alert("Không thể kiểm tra tài khoản.");
                    return;
                }

                if (data.session) {
                    const { error: signOutError } =
                        await supabase.auth.signOut();

                    if (signOutError) {
                        alert(signOutError.message);
                    }

                    return;
                }

                setMode("login");

                if (popup) {
                    popup.classList.add("active");
                }
            });
        }

        if (closeButton && popup) {
            closeButton.addEventListener("click", () => {
                popup.classList.remove("active");
            });

            popup.addEventListener("click", (event) => {
                if (event.target === popup) {
                    popup.classList.remove("active");
                }
            });
        }

        if (switchButton) {
            switchButton.addEventListener("click", () => {
                setMode(mode === "login" ? "signup" : "login");
            });
        }

        // 8. ĐĂNG KÝ / ĐĂNG NHẬP
        if (form) {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const email = emailInput.value.trim();
                const password = passwordInput.value;
                const displayName = displayNameInput.value.trim();

                if (mode === "signup") {
                    if (displayName.length < 2) {
                        showMessage(
                            "Tên hiển thị cần ít nhất 2 ký tự."
                        );
                        return;
                    }
                }

                submitButton.disabled = true;
                showMessage("Đang xử lý...", true);

                try {
                    if (mode === "signup") {
                        const { data, error } =
                            await supabase.auth.signUp({
                                email,
                                password,
                                options: {
                                    data: {
                                        display_name: displayName
                                    }
                                }
                            });

                        if (error) throw error;

                        if (data.session) {
                            showMessage(
                                "Đăng ký thành công!",
                                true
                            );
                        } else {
                            showMessage(
                                "Đã tạo tài khoản. Hãy kiểm tra email để xác nhận.",
                                true
                            );
                        }
                    } else {
                        const { error } =
                            await supabase.auth.signInWithPassword({
                                email,
                                password
                            });

                        if (error) throw error;

                        popup?.classList.remove("active");
                        form.reset();
                    }
                } catch (error) {
                    showMessage(error.message);
                } finally {
                    submitButton.disabled = false;
                }
            });
        }

        // 9. MỞ HỒ SƠ
        if (profileButton && profilePopup) {
            profileButton.addEventListener("click", async () => {
                if (!currentUser) {
                    alert("Vui lòng đăng nhập trước.");
                    return;
                }

                const profile = await loadUserProfile(currentUser);

                if (profileNameInput) {
                    profileNameInput.value =
                        profile?.display_name || "";
                }

                showProfileMessage("");

                profilePopup.classList.add("active");
            });
        }

        if (profileClose && profilePopup) {
            profileClose.addEventListener("click", () => {
                profilePopup.classList.remove("active");
            });

            profilePopup.addEventListener("click", (event) => {
                if (event.target === profilePopup) {
                    profilePopup.classList.remove("active");
                }
            });
        }

        // 10. LƯU HỒ SƠ VÀ ẢNH ĐẠI DIỆN
        if (profileForm) {
            profileForm.addEventListener("submit", async (event) => {
                event.preventDefault();

                if (!currentUser) {
                    showProfileMessage("Bạn chưa đăng nhập.");
                    return;
                }

                const displayName = profileNameInput.value.trim();
                const avatarFile = avatarInput?.files?.[0];

                if (displayName.length < 2 || displayName.length > 30) {
                    showProfileMessage(
                        "Tên hiển thị phải từ 2 đến 30 ký tự."
                    );
                    return;
                }

                if (avatarFile) {
                    if (!avatarFile.type.startsWith("image/")) {
                        showProfileMessage(
                            "Vui lòng chọn một tệp hình ảnh."
                        );
                        return;
                    }

                    if (avatarFile.size > 3 * 1024 * 1024) {
                        showProfileMessage(
                            "Ảnh đại diện không được vượt quá 3MB."
                        );
                        return;
                    }
                }

                const saveButton = profileForm.querySelector(
                    'button[type="submit"]'
                );

                if (saveButton) saveButton.disabled = true;

                showProfileMessage("Đang cập nhật...", true);

                try {
                    let avatarUrl = currentProfile?.avatar_url || null;

                    if (avatarFile) {
                        const extension =
                            avatarFile.name.split(".").pop().toLowerCase();

                        const safeExtension =
                            /^[a-z0-9]+$/.test(extension)
                                ? extension
                                : "jpg";

                        const filePath =
                            `${currentUser.id}/${crypto.randomUUID()}.${safeExtension}`;

                        const { error: uploadError } =
                            await supabase.storage
                                .from("avatars")
                                .upload(filePath, avatarFile, {
                                    contentType: avatarFile.type,
                                    upsert: false
                                });

                        if (uploadError) throw uploadError;

                        const { data: publicData } =
                            supabase.storage
                                .from("avatars")
                                .getPublicUrl(filePath);

                        avatarUrl = publicData.publicUrl;
                    }

                    const { error: updateError } =
                        await supabase
                            .from("profiles")
                            .update({
                                display_name: displayName,
                                avatar_url: avatarUrl,
                                updated_at: new Date().toISOString()
                            })
                            .eq("user_id", currentUser.id);

                    if (updateError) throw updateError;

                    await loadUserProfile(currentUser);

                    showProfileMessage(
                        "Cập nhật hồ sơ thành công!",
                        true
                    );

                    if (avatarInput) {
                        avatarInput.value = "";
                    }

                } catch (error) {
                    console.error("Lỗi cập nhật hồ sơ:", error);
                    showProfileMessage(error.message);
                } finally {
                    if (saveButton) saveButton.disabled = false;
                }
            });
        }

        // 11. THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
        supabase.auth.onAuthStateChange((event, session) => {
            updateAuthUI(session);

            if (event === "SIGNED_IN" && session) {
                popup?.classList.remove("active");
                form?.reset();

                setTimeout(() => {
                    loadUserProfile(session.user);
                }, 0);
            }

            if (event === "SIGNED_OUT") {
                profilePopup?.classList.remove("active");
                console.log("TICKET PASS: Đã đăng xuất.");
            }
        });

        // 12. KIỂM TRA PHIÊN ĐĂNG NHẬP BAN ĐẦU
        const { data: sessionData } =
            await supabase.auth.getSession();

        updateAuthUI(sessionData.session);

        if (sessionData.session) {
            await loadUserProfile(sessionData.session.user);
        }

        // 13. THÔNG BÁO CHO SCRIPT.JS
        window.dispatchEvent(
            new Event("ticketpass-supabase-ready")
        );

        // MẶC ĐỊNH MỞ Ở CHẾ ĐỘ ĐĂNG NHẬP
        setMode("login");

        console.log("TICKET PASS: Auth đã sẵn sàng.");

    } catch (error) {
        console.error("Lỗi Supabase Auth:", error);
    }
}

initAuth();
