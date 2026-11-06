
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase;
let pendingTickets = [];
let approvedTickets = [];
let rejectedTickets = [];

const adminTicketList = document.getElementById("admin-ticket-list");
const adminPostList = document.getElementById("admin-post-list");
const pendingCount = document.getElementById("pending-count");
const approvedCount = document.getElementById("approved-count");
const rejectedCount = document.getElementById("rejected-count");

function filterTickets(ticketList) {
    const searchValue = document
        .getElementById("admin-search").value.trim().toLowerCase();

    const cinemaValue =
        document.getElementById("admin-cinema-filter").value;

    const dateValue =
        document.getElementById("admin-date-filter").value;

    return ticketList.filter(ticket => {
        const matchMovie =
            ticket.movie.toLowerCase().includes(searchValue);

        const matchCinema =
            cinemaValue === "all" || ticket.cinema === cinemaValue;

        const matchDate =
            dateValue === "" || ticket.screening_date === dateValue;

        return matchMovie && matchCinema && matchDate;
    });
}

// TẠO THẺ VÉ

// TẠO THẺ VÉ
function createTicketCard(ticket, statusText, showActions = false) {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const title = document.createElement("h3");
    title.textContent = ticket.movie;

    const cinema = document.createElement("p");
    cinema.textContent = "Rạp: " + ticket.cinema;

    const date = document.createElement("p");
    date.textContent = "Ngày chiếu: " + ticket.screening_date;

    const time = document.createElement("p");
    time.textContent = "Giờ chiếu: " + ticket.screening_time;

    const price = document.createElement("p");
    price.textContent =
        "Giá vé: " + Number(ticket.price).toLocaleString("vi-VN") + "đ";

    const status = document.createElement("p");
    status.textContent = "Trạng thái: " + statusText;

    card.append(title, cinema, date, time, price, status);

    if (ticket.note) {
        const note = document.createElement("p");
        note.textContent = "Ghi chú: " + ticket.note;
        card.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "admin-actions";

    if (showActions) {
        const approveButton = document.createElement("button");
        approveButton.textContent = "DUYỆT VÉ";
        approveButton.addEventListener("click", () => {
            updateTicketStatus(ticket.id, "available");
        });

        const rejectButton = document.createElement("button");
        rejectButton.textContent = "TỪ CHỐI";
        rejectButton.addEventListener("click", () => {
            updateTicketStatus(ticket.id, "rejected");
        });

        actions.append(approveButton, rejectButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "XÓA VÉ";
    deleteButton.style.background = "#c62828";

    deleteButton.addEventListener("click", () => {
        deleteTicket(ticket.id);
    });

    actions.appendChild(deleteButton);
    card.appendChild(actions);

    return card;
}


// TẢI VÉ TỪ SUPABASE
async function loadTickets() {
    try {
        const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        pendingTickets = data.filter(
            ticket => ticket.status === "pending_review"
        );

        approvedTickets = data.filter(
            ticket => ticket.status === "available"
        );

        rejectedTickets = data.filter(
            ticket => ticket.status === "rejected"
        );

        displayAdminTickets();
        displayTicketHistory();

    } catch (error) {
        console.error("Lỗi tải danh sách vé:", error);
        adminTicketList.textContent =
            "Không thể tải vé. Vui lòng kiểm tra quyền Admin.";
    }
}

async function loadAdminPosts() {
    if (!adminPostList) return;

    adminPostList.innerHTML = "<p>Đang tải bài viết...</p>";

    try {
        const { data: posts, error } = await supabase
            .from("posts")
            .select("id, user_id, content, created_at")
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            adminPostList.innerHTML = "<p>Chưa có bài viết nào.</p>";
            return;
        }

        adminPostList.innerHTML = "";

        posts.forEach(post => {
            const card = document.createElement("div");
            card.className = "admin-ticket-card";

            const content = document.createElement("p");
            content.textContent = post.content;

            const date = document.createElement("small");
            date.textContent = new Date(post.created_at)
                .toLocaleString("vi-VN");

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "XÓA BÀI VIẾT";
            deleteButton.className = "post-delete-button";

            deleteButton.addEventListener("click", async () => {
                if (!confirm("Bạn có chắc muốn xóa bài viết này không?")) {
                    return;
                }

                deleteButton.disabled = true;

                try {
                    const { data, error } = await supabase
                        .from("posts")
                        .delete()
                        .eq("id", post.id)
                        .select();

                    if (error) throw error;

                    if (!data || data.length === 0) {
                        throw new Error("Không có bài viết nào được xóa. Hãy kiểm tra quyền Admin.");
                    }

                    alert("Đã xóa bài viết!");
                    await loadAdminPosts();

                } catch (error) {
                    alert("Không thể xóa bài viết: " + error.message);
                    deleteButton.disabled = false;
                }
            });

            card.append(content, date, deleteButton);
            adminPostList.appendChild(card);
        });

    } catch (error) {
        console.error("Lỗi tải bài viết:", error);
        adminPostList.innerHTML =
            "<p>Không thể tải bài viết: " + error.message + "</p>";
    }
}


// HIỂN THỊ VÉ CHỜ DUYỆT
function displayAdminTickets() {
    adminTicketList.innerHTML = "";

    pendingCount.textContent = pendingTickets.length;
    approvedCount.textContent = approvedTickets.length;
    rejectedCount.textContent = rejectedTickets.length;

    const filtered = filterTickets(pendingTickets);

    if (filtered.length === 0) {
        adminTicketList.textContent = "Chưa có yêu cầu đăng vé.";
        return;
    }

    filtered.forEach(ticket => {
        adminTicketList.appendChild(
            createTicketCard(ticket, "Chờ kiểm duyệt", true)
        );
    });
}

// HIỂN THỊ LỊCH SỬ
function displayTicketHistory() {
    const approvedList =
        document.getElementById("approved-ticket-list");

    const rejectedList =
        document.getElementById("rejected-ticket-list");

    approvedList.innerHTML = "";
    rejectedList.innerHTML = "";

    const filteredApproved = filterTickets(approvedTickets);
    const filteredRejected = filterTickets(rejectedTickets);

    if (filteredApproved.length === 0) {
        approvedList.textContent = "Chưa có vé được duyệt.";
    } else {
        filteredApproved.forEach(ticket => {
            approvedList.appendChild(
                createTicketCard(ticket, "Đã duyệt")
            );
        });
    }

    if (filteredRejected.length === 0) {
        rejectedList.textContent = "Chưa có vé bị từ chối.";
    } else {
        filteredRejected.forEach(ticket => {
            rejectedList.appendChild(
                createTicketCard(ticket, "Đã từ chối")
            );
        });
    }
}

// ADMIN XÓA VÉ
async function deleteTicket(ticketId) {
    const confirmed = confirm(
        "Bạn có chắc chắn muốn xóa vé này không? Thao tác này không thể hoàn tác."
    );

    if (!confirmed) return;

    try {
        const { data, error } = await supabase
            .from("tickets")
            .delete()
            .eq("id", ticketId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            alert("Không thể xóa vé. Hãy kiểm tra quyền Admin.");
            return;
        }

        alert("Đã xóa vé thành công!");
        await loadTickets();

    } catch (error) {
        console.error("Lỗi xóa vé:", error);

        alert(
            "Không thể xóa vé. Vé có thể đang liên kết với giao dịch. " +
            error.message
        );
    }
}


// DUYỆT HOẶC TỪ CHỐI VÉ
async function updateTicketStatus(ticketId, newStatus) {
    const confirmMessage = newStatus === "available"
        ? "Bạn có chắc muốn duyệt vé này?"
        : "Bạn có chắc muốn từ chối vé này?";

    if (!confirm(confirmMessage)) return;

    try {
        const { data, error } = await supabase
            .from("tickets")
            .update({ status: newStatus })
            .eq("id", ticketId)
            .eq("status", "pending_review")
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            alert("Không cập nhật được vé. Vé có thể đã được xử lý.");
            return;
        }

        alert(
            newStatus === "available"
                ? "Đã duyệt vé thành công!"
                : "Đã từ chối vé."
        );

        await loadTickets();

    } catch (error) {
        console.error("Lỗi cập nhật vé:", error);
        alert("Không thể cập nhật vé. Vui lòng thử lại.");
    }
}

// LÀM MỚI DANH SÁCH
function refreshAllTicketLists() {
    displayAdminTickets();
    displayTicketHistory();
}

document.getElementById("admin-search").addEventListener(
    "input", refreshAllTicketLists
);

document.getElementById("admin-cinema-filter").addEventListener(
    "change", refreshAllTicketLists
);

document.getElementById("admin-date-filter").addEventListener(
    "change", refreshAllTicketLists
);

document.getElementById("admin-reset-filter").addEventListener(
    "click", function() {
        document.getElementById("admin-search").value = "";
        document.getElementById("admin-cinema-filter").value = "all";
        document.getElementById("admin-date-filter").value = "";

        refreshAllTicketLists();
    }
);

// ĐĂNG XUẤT ADMIN
document.getElementById("admin-logout").addEventListener(
    "click", async function() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Lỗi đăng xuất:", error);
            alert("Không thể đăng xuất.");
            return;
        }

        window.location.href = "admin-login.html";
    }
);

// KHỞI TẠO VÀ KIỂM TRA QUYỀN ADMIN
async function initAdmin() {
    try {
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Không lấy được cấu hình Supabase.");
        }

        const config = await response.json();

        supabase = createClient(
            config.supabaseUrl,
            config.supabasePublishableKey
        );

        const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
            window.location.href = "admin-login.html";
            return;
        }

        const { data: admin, error: adminError } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (adminError) throw adminError;

        if (!admin) {
            await supabase.auth.signOut();
            window.location.href = "admin-login.html";
            return;
        }

        await loadTickets();
        await loadAdminPosts();

    } catch (error) {
        console.error("Lỗi khởi tạo Admin:", error);
        alert("Không thể xác thực quyền Admin.");
        window.location.href = "admin-login.html";
    }
}

initAdmin();
