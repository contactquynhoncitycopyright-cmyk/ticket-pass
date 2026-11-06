

// =====================================
// TICKET PASS - MAIN JAVASCRIPT
// =====================================


// =====================================
// 1. SELL TICKET FORM
// =====================================


// =====================================
// TICKET PASS - MAIN JAVASCRIPT
// =====================================


// =====================================
// 1. SELL TICKET POPUP
// =====================================



// =====================================
// TICKET PASS - MAIN JAVASCRIPT
// =====================================


// =====================================
// 1. SELL TICKET POPUP
// =====================================


const sellPopup = document.getElementById("sell-popup");
const openSellForm = document.getElementById("open-sell-form");
const closeSellForm = document.getElementById("close-sell-form");
const sellTicketForm = document.getElementById("sell-ticket-form");

if (openSellForm && sellPopup) {
    openSellForm.addEventListener("click", () => {
        sellPopup.style.display = "flex";
    });
}

if (closeSellForm && sellPopup) {
    closeSellForm.addEventListener("click", () => {
        sellPopup.style.display = "none";
    });
}

if (sellPopup) {
    sellPopup.addEventListener("click", event => {
        if (event.target === sellPopup) {
            sellPopup.style.display = "none";
        }
    });
}


// =====================================
// 2. SUBMIT TICKET FOR REVIEW
// =====================================

if (sellTicketForm) {
    sellTicketForm.addEventListener("submit", async event => {
        event.preventDefault();

        const movieInput = document.getElementById("sell-movie");
        const cinemaInput = document.getElementById("sell-cinema");
        const dateInput = document.getElementById("sell-date");
        const timeInput = document.getElementById("sell-time");
        const priceInput = document.getElementById("sell-price");
        const noteInput = document.getElementById("sell-note");

        if (
            !movieInput ||
            !cinemaInput ||
            !dateInput ||
            !timeInput ||
            !priceInput ||
            !noteInput
        ) {
            alert("Form đăng vé đang thiếu thông tin.");
            return;
        }

        const newTicket = {
            movie: movieInput.value.trim(),
            cinema: cinemaInput.value,
            date: dateInput.value,
            time: timeInput.value,
            price: Number(priceInput.value),
            note: noteInput.value.trim()
        };

        if (
            !newTicket.movie ||
            !newTicket.cinema ||
            !newTicket.date ||
            !newTicket.time ||
            !Number.isFinite(newTicket.price) ||
            newTicket.price <= 0
        ) {
            alert("Vui lòng nhập đầy đủ thông tin vé.");
            return;
        }

        try {
            const supabase = window.ticketPassSupabase;

            if (!supabase) {
                throw new Error("Supabase chưa được khởi tạo.");
            }

            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError) throw userError;

            const user = userData.user;

            if (!user) {
                alert("Vui lòng đăng nhập trước khi đăng vé.");
                return;
            }

            const { error: insertError } = await supabase
                .from("tickets")
                .insert({
                    user_id: user.id,
                    movie: newTicket.movie,
                    cinema: newTicket.cinema,
                    screening_date: newTicket.date,
                    screening_time: newTicket.time,
                    price: newTicket.price,
                    note: newTicket.note,
                    status: "pending_review"
                });

            if (insertError) throw insertError;

            alert("Đã gửi yêu cầu! Vé đang chờ kiểm duyệt.");

            sellTicketForm.reset();

            if (sellPopup) {
                sellPopup.style.display = "none";
            }

        } catch (error) {
            console.error("Lỗi lưu vé:", error);
            alert("Không thể lưu vé: " + error.message);
        }
    });
}


// =====================================
// 3. CLOSE POPUPS WITH ESC
// =====================================

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (sellPopup) {
        sellPopup.style.display = "none";
    }

    const profilePopup = document.getElementById("profile-popup");

    if (profilePopup) {
        profilePopup.classList.remove("active");
    }

    const publicPopup = document.getElementById("public-profile-popup");

    if (publicPopup) {
        publicPopup.classList.remove("active");
    }

    const notificationPopupElement = document.getElementById(
        "notification-popup"
    );

    if (notificationPopupElement) {
        notificationPopupElement.classList.remove("active");
    }
});


// =====================================
// 4. LOAD MOVIES FROM TMDB
// =====================================

const movieList = document.getElementById("movie-list");

async function loadMovies() {
    if (!movieList) return;

    try {
        movieList.textContent = "Đang tải danh sách phim...";

        const response = await fetch("/api/movies");

        if (!response.ok) {
            throw new Error("API TMDB trả về lỗi: " + response.status);
        }

        const movies = await response.json();

        if (!Array.isArray(movies)) {
            throw new Error("Dữ liệu phim không hợp lệ.");
        }

        movieList.replaceChildren();

        if (movies.length === 0) {
            movieList.textContent = "Hiện chưa có phim để hiển thị.";
            return;
        }

        movies.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.className = "movie-card";

            if (movie.poster_path) {
                const poster = document.createElement("img");

                poster.className = "movie-poster";
                poster.src =
                    "https://image.tmdb.org/t/p/w500" + movie.poster_path;

                poster.alt = movie.title || "Poster phim";
                poster.loading = "lazy";

                movieCard.appendChild(poster);
            } else {
                const noPoster = document.createElement("div");

                noPoster.className = "no-poster";
                noPoster.textContent = "Chưa có poster";

                movieCard.appendChild(noPoster);
            }

            const movieInfo = document.createElement("div");
            movieInfo.className = "movie-info";

            const movieTitle = createElement(
                "h3",
                "",
                movie.title || "Chưa có tên phim"
            );

            const releaseDate = createElement(
                "p",
                "",
                "Ngày phát hành: " + (movie.release_date || "Chưa cập nhật")
            );

            const rating = createElement(
                "p",
                "",
                "Đánh giá: " +
                (
                    movie.vote_average
                        ? Number(movie.vote_average).toFixed(1)
                        : "Chưa có"
                ) +
                "/10"
            );

            movieInfo.append(movieTitle, releaseDate, rating);
            movieCard.appendChild(movieInfo);
            movieList.appendChild(movieCard);
        });

        console.log("TMDB: Đã tải thành công " + movies.length + " phim.");

    } catch (error) {
        console.error("Lỗi tải phim:", error);

        movieList.textContent =
            "Không thể tải danh sách phim. Vui lòng thử tải lại trang.";
    }
}

loadMovies();


// =====================================
// 5. COMMUNITY - CÁC PHẦN TỬ
// =====================================

const postContent = document.getElementById("post-content");
const submitPostButton = document.getElementById("submit-post");
const postMessage = document.getElementById("post-message");

const postList = document.getElementById("community-post-list");
const emptyMessage = document.querySelector(".community-empty");

let communityUser = null;


// =====================================
// 6. COMMUNITY - HÀM TIỆN ÍCH
// =====================================

function showPostMessage(text, success = false) {
    if (!postMessage) return;

    postMessage.textContent = text;
    postMessage.style.color = success ? "#4ade80" : "#ff7777";
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function formatDate(date) {
    return new Date(date).toLocaleString("vi-VN");
}

async function getCommunityUser() {
    const supabase = window.ticketPassSupabase;

    if (!supabase) return null;

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) return null;

    return data.user;
}


// =====================================
// 7. COMMUNITY - ĐĂNG BÀI
// =====================================

if (submitPostButton && postContent) {
    submitPostButton.addEventListener("click", async () => {
        const supabase = window.ticketPassSupabase;
        const content = postContent.value.trim();

        if (!supabase) {
            showPostMessage("Supabase chưa sẵn sàng. Hãy tải lại trang.");
            return;
        }

        if (!content) {
            showPostMessage("Bạn chưa nhập nội dung bài viết.");
            return;
        }

        if (content.length > 5000) {
            showPostMessage("Bài viết không được vượt quá 5000 ký tự.");
            return;
        }

        const user = await getCommunityUser();

        if (!user) {
            showPostMessage("Bạn cần đăng nhập để đăng bài.");
            return;
        }

        submitPostButton.disabled = true;
        showPostMessage("Đang đăng bài...", true);

        try {
            const { error } = await supabase
                .from("posts")
                .insert({
                    user_id: user.id,
                    content: content
                });

            if (error) throw error;

            postContent.value = "";

            showPostMessage("Đăng bài thành công!", true);

            await loadCommunityPosts();

        } catch (error) {
            console.error("Lỗi đăng bài:", error);
            showPostMessage("Không thể đăng bài: " + error.message);

        } finally {
            submitPostButton.disabled = false;
        }
    });
}


// =====================================
// 8. COMMUNITY - TẠO THẺ BÀI VIẾT
// =====================================

function createPostCard(post, profile, likes, comments, likedByMe) {
    const supabase = window.ticketPassSupabase;

    const card = createElement("article", "community-post-card");
    card.dataset.postId = post.id;

    const authorArea = createElement("div", "post-author-area");
    const avatar = createElement("div", "post-avatar");

    if (profile?.avatar_url) {
        const image = document.createElement("img");

        image.src = profile.avatar_url;
        image.alt = "Ảnh đại diện";
        image.loading = "lazy";

        avatar.appendChild(image);
    } else {
        avatar.textContent = "TP";
    }

    const authorInfo = createElement("div", "post-author-info");

    const author = createElement(
        "h3",
        "post-author",
        profile?.display_name || "Thành viên TICKET PASS"
    );

    const date = createElement(
        "small",
        "post-date",
        formatDate(post.created_at)
    );

    authorInfo.append(author, date);
    authorArea.append(avatar, authorInfo);

    avatar.style.cursor = "pointer";
    author.style.cursor = "pointer";

    avatar.addEventListener("click", () => {
        openPublicProfile(post.user_id);
    });

    author.addEventListener("click", () => {
        openPublicProfile(post.user_id);
    });

    const content = createElement("p", "post-content", post.content);
    const ownerActions = createElement("div", "post-owner-actions");

    if (communityUser && communityUser.id === post.user_id) {
        const editButton = createElement("button", "post-edit-button", "Sửa");
        const deleteButton = createElement("button", "post-delete-button", "Xóa");

        editButton.type = "button";
        deleteButton.type = "button";

        editButton.addEventListener("click", async () => {
            const newContent = prompt("Nhập nội dung bài viết mới:", post.content);

            if (newContent === null) return;

            const cleanedContent = newContent.trim();

            if (!cleanedContent) {
                alert("Nội dung không được để trống.");
                return;
            }

            if (cleanedContent.length > 5000) {
                alert("Bài viết không được vượt quá 5000 ký tự.");
                return;
            }

            editButton.disabled = true;

            try {
                const { error } = await supabase
                    .from("posts")
                    .update({ content: cleanedContent })
                    .eq("id", post.id)
                    .eq("user_id", communityUser.id);

                if (error) throw error;

                await loadCommunityPosts();

            } catch (error) {
                alert("Không thể sửa bài viết: " + error.message);

            } finally {
                editButton.disabled = false;
            }
        });

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Bạn có chắc muốn xóa bài viết này không?")) return;

            deleteButton.disabled = true;

            try {
                const { error } = await supabase
                    .from("posts")
                    .delete()
                    .eq("id", post.id)
                    .eq("user_id", communityUser.id);

                if (error) throw error;

                await loadCommunityPosts();

            } catch (error) {
                alert("Không thể xóa bài viết: " + error.message);
                deleteButton.disabled = false;
            }
        });

        ownerActions.append(editButton, deleteButton);
    }

    const actionArea = createElement("div", "post-action-area");

    const likeButton = createElement(
        "button",
        likedByMe ? "post-like-button liked" : "post-like-button",
        (likedByMe ? "♥ " : "♡ ") + likes.length + " Thích"
    );

    likeButton.type = "button";

    likeButton.addEventListener("click", async () => {
        if (!communityUser) {
            alert("Bạn cần đăng nhập để thích bài viết.");
            return;
        }

        likeButton.disabled = true;

        try {
            if (likedByMe) {
                const { error } = await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", post.id)
                    .eq("user_id", communityUser.id);

                if (error) throw error;

            } else {
                const { error } = await supabase
                    .from("likes")
                    .insert({
                        post_id: post.id,
                        user_id: communityUser.id
                    });

                if (error) throw error;
            }

            await loadCommunityPosts();

        } catch (error) {
            alert("Không thể cập nhật lượt thích: " + error.message);

        } finally {
            likeButton.disabled = false;
        }
    });

    const commentSection = createElement("div", "post-comment-section");

    const commentTitle = createElement(
        "h4",
        "post-comment-title",
        "Bình luận (" + comments.length + ")"
    );

    const commentList = createElement("div", "post-comment-list");

    comments.forEach(comment => {
        const commentItem = createElement("div", "post-comment-item");
        const commentInfo = createElement("div", "post-comment-info");
        const commentProfile = comment.profiles;

        const commentAuthor = createElement(
            "strong",
            "",
            commentProfile?.display_name || "Thành viên TICKET PASS"
        );

        const commentDate = createElement(
            "small",
            "",
            formatDate(comment.created_at)
        );

        commentInfo.append(commentAuthor, commentDate);

        const commentText = createElement(
            "p",
            "post-comment-content",
            comment.content
        );

        commentItem.append(commentInfo, commentText);

        if (communityUser && communityUser.id === comment.user_id) {
            const deleteComment = createElement(
                "button",
                "comment-delete-button",
                "Xóa bình luận"
            );

            deleteComment.type = "button";

            deleteComment.addEventListener("click", async () => {
                if (!confirm("Xóa bình luận này?")) return;

                try {
                    const { error } = await supabase
                        .from("comments")
                        .delete()
                        .eq("id", comment.id)
                        .eq("user_id", communityUser.id);

                    if (error) throw error;

                    await loadCommunityPosts();

                } catch (error) {
                    alert("Không thể xóa bình luận: " + error.message);
                }
            });

            commentItem.appendChild(deleteComment);
        }

        commentList.appendChild(commentItem);
    });

    const commentForm = document.createElement("form");
    commentForm.className = "post-comment-form";

    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = communityUser
        ? "Viết bình luận..."
        : "Đăng nhập để bình luận...";
    commentInput.maxLength = 2000;
    commentInput.disabled = !communityUser;
    commentInput.required = true;

    const commentSubmit = createElement("button", "", "Gửi");

    commentSubmit.type = "submit";
    commentSubmit.disabled = !communityUser;

    commentForm.append(commentInput, commentSubmit);

    commentForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!communityUser) {
            alert("Bạn cần đăng nhập để bình luận.");
            return;
        }

        const commentText = commentInput.value.trim();

        if (!commentText) return;

        commentSubmit.disabled = true;

        try {
            const { error } = await supabase
                .from("comments")
                .insert({
                    post_id: post.id,
                    user_id: communityUser.id,
                    content: commentText
                });

            if (error) throw error;

            await loadCommunityPosts();

        } catch (error) {
            alert("Không thể gửi bình luận: " + error.message);

        } finally {
            commentSubmit.disabled = false;
        }
    });

    commentSection.append(commentTitle, commentList, commentForm);

    actionArea.append(likeButton);

    const shareButton = createElement("button", "post-share-button", "↗ Chia sẻ");
    shareButton.type = "button";

    shareButton.addEventListener("click", async () => {
        const shareUrl = new URL(window.location.href);
        shareUrl.hash = "post-" + post.id;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Bài viết trên TICKET PASS",
                    text: post.content,
                    url: shareUrl.href
                });

            } else {
                await navigator.clipboard.writeText(shareUrl.href);
                alert("Đã sao chép liên kết bài viết!");
            }

        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Lỗi chia sẻ:", error);
                alert("Không thể chia sẻ bài viết.");
            }
        }
    });

    actionArea.append(shareButton);

    card.append(
        authorArea,
        content,
        ownerActions,
        actionArea,
        commentSection
    );

    return card;
}


// =====================================
// 9. COMMUNITY - TẢI BÀI VIẾT
// =====================================

async function loadCommunityPosts() {
    const supabase = window.ticketPassSupabase;

    if (!supabase || !postList) return;

    postList.textContent = "Đang tải bài viết...";

    try {
        const userResult = await supabase.auth.getUser();

        communityUser = userResult.data?.user || null;

        const { data: posts, error: postError } = await supabase
            .from("posts")
            .select("id, user_id, content, created_at")
            .order("created_at", { ascending: false });

        if (postError) throw postError;

        postList.replaceChildren();

        if (!posts || posts.length === 0) {
            if (emptyMessage) emptyMessage.style.display = "block";

            window.communityPostsData = null;
            return;
        }

        if (emptyMessage) emptyMessage.style.display = "none";

        const userIds = [...new Set(posts.map(post => post.user_id))];
        const postIds = posts.map(post => post.id);

        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds);

        if (profileError) throw profileError;

        const { data: likes, error: likeError } = await supabase
            .from("likes")
            .select("post_id, user_id")
            .in("post_id", postIds);

        if (likeError) throw likeError;

        const { data: comments, error: commentError } = await supabase
            .from("comments")
            .select("id, post_id, user_id, content, created_at")
            .in("post_id", postIds)
            .order("created_at", { ascending: true });

        if (commentError) throw commentError;

        const profileMap = new Map(
            (profiles || []).map(profile => [profile.user_id, profile])
        );

        const likesByPost = new Map();
        const commentsByPost = new Map();

        (likes || []).forEach(like => {
            if (!likesByPost.has(like.post_id)) {
                likesByPost.set(like.post_id, []);
            }

            likesByPost.get(like.post_id).push(like);
        });

        (comments || []).forEach(comment => {
            if (!commentsByPost.has(comment.post_id)) {
                commentsByPost.set(comment.post_id, []);
            }

            commentsByPost.get(comment.post_id).push({
                ...comment,
                profiles: profileMap.get(comment.user_id)
            });
        });

        function renderCommunityPosts(postsToRender) {
            postList.replaceChildren();

            if (postsToRender.length === 0) {
                postList.textContent = "Không tìm thấy bài viết phù hợp.";
                return;
            }

            postsToRender.forEach(post => {
                const profile = profileMap.get(post.user_id);
                const postLikes = likesByPost.get(post.id) || [];
                const postComments = commentsByPost.get(post.id) || [];

                const likedByMe = !!(
                    communityUser &&
                    postLikes.some(like => like.user_id === communityUser.id)
                );

                postList.appendChild(
                    createPostCard(
                        post,
                        profile,
                        postLikes,
                        postComments,
                        likedByMe
                    )
                );
            });
        }

        window.communityPostsData = {
            posts,
            profileMap,
            renderCommunityPosts
        };

        renderCommunityPosts(posts);

        function openSharedPost() {
            const hash = window.location.hash;

            if (!hash.startsWith("#post-")) return;

            const realPostId = hash.slice("#post-".length);

            const sharedPost = posts.find(
                post => String(post.id) === realPostId
            );

            if (!sharedPost) return;

            const postCard = Array.from(
                postList.querySelectorAll("[data-post-id]")
            ).find(card => card.dataset.postId === realPostId);

            if (!postCard) return;

            postCard.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            postCard.style.outline = "2px solid #c9a45c";

            setTimeout(() => {
                postCard.style.outline = "";
            }, 3000);
        }

        openSharedPost();

        console.log("Community: Đã tải thành công " + posts.length + " bài viết.");

    } catch (error) {
        console.error("Lỗi tải bài viết Community:", error);

        postList.textContent =
            "Không thể tải bài viết. Vui lòng thử lại.";
    }
}


// =====================================
// 10. TÌM KIẾM VÀ SẮP XẾP BÀI VIẾT
// =====================================

const communitySearchInput = document.getElementById(
    "community-search-input"
);

const communitySort = document.getElementById("community-sort");

function filterCommunityPosts() {
    const data = window.communityPostsData;

    if (!data) return;

    const keyword = communitySearchInput
        ? communitySearchInput.value.trim().toLocaleLowerCase("vi")
        : "";

    const sortType = communitySort
        ? communitySort.value
        : "newest";

    let filteredPosts = data.posts.filter(post => {
        const profile = data.profileMap.get(post.user_id);

        const content = (post.content || "").toLocaleLowerCase("vi");
        const author = (profile?.display_name || "").toLocaleLowerCase("vi");

        return content.includes(keyword) || author.includes(keyword);
    });

    filteredPosts.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        return sortType === "oldest"
            ? dateA - dateB
            : dateB - dateA;
    });

    data.renderCommunityPosts(filteredPosts);
}

communitySearchInput?.addEventListener("input", filterCommunityPosts);
communitySort?.addEventListener("change", filterCommunityPosts);


// =====================================
// 11. HỒ SƠ CÁ NHÂN CÔNG KHAI
// =====================================

const publicProfilePopup = document.getElementById(
    "public-profile-popup"
);

const closePublicProfile = document.getElementById(
    "close-public-profile"
);

async function openPublicProfile(userId) {
    const supabase = window.ticketPassSupabase;

    if (!supabase || !publicProfilePopup) return;

    try {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (profileError) throw profileError;

        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        document.getElementById("public-profile-name").textContent =
            profile.display_name || "Thành viên TICKET PASS";

        document.getElementById("public-profile-avatar").src =
            profile.avatar_url || "";

        document.getElementById("public-profile-joined").textContent =
            profile.created_at
                ? "Tham gia: " + formatDate(profile.created_at)
                : "Thành viên TICKET PASS";

        document.getElementById("public-profile-post-count").textContent =
            posts.length + " bài viết";

        const postContainer = document.getElementById(
            "public-profile-post-list"
        );

        postContainer.replaceChildren();

        if (posts.length === 0) {
            postContainer.textContent = "Thành viên chưa có bài viết.";

        } else {
            posts.forEach(post => {
                const postCard = createElement("article", "community-post-card");

                const content = createElement(
                    "p",
                    "post-content",
                    post.content
                );

                const date = createElement(
                    "small",
                    "post-date",
                    formatDate(post.created_at)
                );

                postCard.append(content, date);
                postContainer.appendChild(postCard);
            });
        }

        publicProfilePopup.classList.add("active");

    } catch (error) {
        console.error("Lỗi mở hồ sơ:", error);
        alert("Không thể tải hồ sơ thành viên: " + error.message);
    }
}

closePublicProfile?.addEventListener("click", () => {
    publicProfilePopup.classList.remove("active");
});

publicProfilePopup?.addEventListener("click", event => {
    if (event.target === publicProfilePopup) {
        publicProfilePopup.classList.remove("active");
    }
});


// =====================================
// 12. HỆ THỐNG THÔNG BÁO
// =====================================

const notificationButton = document.getElementById("open-notifications");
const notificationPopup = document.getElementById("notification-popup");
const closeNotifications = document.getElementById("close-notifications");
const notificationCount = document.getElementById("notification-count");
const notificationList = document.getElementById("notification-list");


async function loadNotifications() {
    const supabase = window.ticketPassSupabase;

    if (!supabase || !notificationCount || !notificationList) return;

    try {
        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError) throw userError;

        const user = userData.user;

        if (!user) {
            notificationCount.textContent = "0";
            notificationList.textContent =
                "Hãy đăng nhập để xem thông báo.";
            return;
        }

        const { data: notifications, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("recipient_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const notificationData = notifications || [];

        // Gộp các thông báo tin nhắn theo người gửi và cuộc trò chuyện
        const groupedMessages = new Map();
        const displayNotifications = [];

        notificationData.forEach(notification => {
            if (
                notification.type === "message" &&
                notification.conversation_id
            ) {
                const key =
                    notification.actor_id + "_" +
                    notification.conversation_id;

                if (!groupedMessages.has(key)) {
                    groupedMessages.set(key, {
                        ...notification,
                        ids: [],
                        unreadCount: 0
                    });
                }

                const group = groupedMessages.get(key);

                group.ids.push(notification.id);

                if (!notification.is_read) {
                    group.unreadCount++;
                }

            } else {
                displayNotifications.push({
                    ...notification,
                    ids: [notification.id],
                    unreadCount: notification.is_read ? 0 : 1
                });
            }
        });

        groupedMessages.forEach(group => {
            displayNotifications.push(group);
        });

        // Sắp xếp thông báo mới nhất lên trước
        displayNotifications.sort(
            (a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
        );

        // Đếm số thông báo chưa đọc sau khi gộp
        const unreadCount = displayNotifications.filter(
            item => item.unreadCount > 0
        ).length;

        notificationCount.textContent =
            unreadCount > 99 ? "99+" : unreadCount;

        notificationList.replaceChildren();

        if (displayNotifications.length === 0) {
            notificationList.textContent = "Chưa có thông báo.";
            return;
        }

        const actorIds = [
            ...new Set(
                displayNotifications
                    .map(item => item.actor_id)
                    .filter(Boolean)
            )
        ];

        let profiles = [];

        if (actorIds.length > 0) {
            const { data, error: profileError } = await supabase
                .from("profiles")
                .select("user_id, display_name")
                .in("user_id", actorIds);

            if (profileError) throw profileError;

            profiles = data || [];
        }

        const profileMap = new Map(
            profiles.map(profile => [profile.user_id, profile])
        );

        displayNotifications.forEach(notification => {
            const actor = profileMap.get(notification.actor_id);

            const item = createElement(
                "div",
                notification.unreadCount > 0
                    ? "notification-item unread"
                    : "notification-item"
            );

            item.style.cursor = "pointer";

            const actorName =
                actor?.display_name || "Một thành viên";

            let message = "đã gửi cho bạn một thông báo.";

            if (notification.type === "like") {
                message = "đã thích bài viết của bạn.";
            } else if (notification.type === "comment") {
                message = "đã bình luận bài viết của bạn.";
            } else if (notification.type === "message") {
                const count = notification.unreadCount;

                message = count > 0
                    ? `đã gửi cho bạn ${count} tin nhắn mới.`
                    : "đã gửi cho bạn tin nhắn.";
            }

            const text = createElement(
                "p",
                "",
                actorName + " " + message
            );

            const date = createElement(
                "small",
                "",
                formatDate(notification.created_at)
            );

            item.append(text, date);

            item.addEventListener("click", async () => {
                item.style.pointerEvents = "none";

                try {
                    const unreadIds = notificationData
                        .filter(row =>
                            notification.ids.includes(row.id) &&
                            !row.is_read
                        )
                        .map(row => row.id);

                    if (unreadIds.length > 0) {
                        const { error: updateError } = await supabase
                            .from("notifications")
                            .update({ is_read: true })
                            .in("id", unreadIds)
                            .eq("recipient_id", user.id);

                        if (updateError) throw updateError;
                    }

                    notificationPopup?.classList.remove("active");

                    // MỞ CUỘC TRÒ CHUYỆN
                    if (
                        notification.type === "message" &&
                        notification.conversation_id
                    ) {
                        if (
                            typeof window.ticketPassOpenConversation ===
                            "function"
                        ) {
                            await window.ticketPassOpenConversation(
                                notification.conversation_id
                            );
                        } else {
                            alert(
                                "Chức năng chat chưa sẵn sàng. Vui lòng thử lại."
                            );
                        }
                    }

                    // MỞ BÀI VIẾT
                    else if (notification.post_id) {
                        let postCard = Array.from(
                            document.querySelectorAll("[data-post-id]")
                        ).find(
                            card =>
                                card.dataset.postId ===
                                String(notification.post_id)
                        );

                        if (!postCard) {
                            await loadCommunityPosts();

                            postCard = Array.from(
                                document.querySelectorAll("[data-post-id]")
                            ).find(
                                card =>
                                    card.dataset.postId ===
                                    String(notification.post_id)
                            );
                        }

                        if (postCard) {
                            postCard.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });

                            postCard.style.outline =
                                "2px solid #c9a45c";

                            setTimeout(() => {
                                postCard.style.outline = "";
                            }, 3000);

                        } else {
                            alert(
                                "Bài viết này hiện không có trên trang."
                            );
                        }
                    }

                } catch (error) {
                    console.error("Lỗi mở thông báo:", error);

                    alert(
                        "Không thể mở thông báo: " + error.message
                    );

                } finally {
                    item.style.pointerEvents = "";
                    await loadNotifications();
                }
            });

            notificationList.appendChild(item);
        });

    } catch (error) {
        console.error("Lỗi tải thông báo:", error);

        notificationList.textContent =
            "Không thể tải thông báo. Vui lòng thử lại.";
    }
}


notificationButton?.addEventListener("click", async () => {
    notificationPopup?.classList.add("active");
    await loadNotifications();
});

closeNotifications?.addEventListener("click", () => {
    notificationPopup?.classList.remove("active");
});

notificationPopup?.addEventListener("click", event => {
    if (event.target === notificationPopup) {
        notificationPopup.classList.remove("active");
    }
});


// =====================================
// 13. TICKET MARKET - LOAD APPROVED TICKETS
// =====================================

const approvedTicketList = document.getElementById(
    "approved-ticket-list"
);

async function loadApprovedTickets() {
    if (!approvedTicketList) return;

    const supabase = window.ticketPassSupabase;

    if (!supabase) {
        approvedTicketList.textContent = "Chưa kết nối được Supabase.";
        return;
    }

    approvedTicketList.textContent = "Đang tải danh sách vé...";

    try {
        const { data: tickets, error } = await supabase
            .from("tickets")
            .select("*")
            .eq("status", "available")
            .order("created_at", { ascending: false });

        if (error) throw error;

        approvedTicketList.replaceChildren();

        if (!tickets || tickets.length === 0) {
            approvedTicketList.textContent =
                "Hiện chưa có vé nào được duyệt.";
            return;
        }

        tickets.forEach(ticket => {
            const card = document.createElement("article");
            card.className = "approved-ticket-card";

            const date = new Date(ticket.screening_date + "T00:00:00");
            const formattedDate = date.toLocaleDateString("vi-VN");

            const formattedPrice = Number(ticket.price)
                .toLocaleString("vi-VN") + " VNĐ";

            card.innerHTML = `
                <div class="ticket-card-top">
                    <span class="ticket-status">ĐANG MỞ BÁN</span>
                    <span class="ticket-icon">🎟️</span>
                </div>

                <h3 class="ticket-movie">
                    ${escapeTicketHTML(ticket.movie)}
                </h3>

                <div class="ticket-details">
                    <p>📍 ${escapeTicketHTML(ticket.cinema)}</p>
                    <p>📅 ${formattedDate}</p>
                    <p>🕒 ${String(ticket.screening_time).slice(0, 5)}</p>
                </div>

                <div class="ticket-card-bottom">
                    <strong>${formattedPrice}</strong>
                </div>

                ${
                    ticket.note
                        ? `<p class="ticket-note">${escapeTicketHTML(ticket.note)}</p>`
                        : ""
                }

                <button
                    type="button"
                    class="request-ticket-btn"
                    data-ticket-id="${ticket.id}"
                    data-seller-id="${ticket.user_id}"
                >
                    YÊU CẦU MUA VÉ
                </button>
            `;

            approvedTicketList.appendChild(card);
        });

    } catch (error) {
        console.error("Lỗi tải vé:", error);

        approvedTicketList.textContent =
            "Không tải được danh sách vé. Vui lòng thử lại.";
    }
}


// =====================================
// 14. GỬI YÊU CẦU MUA VÉ
// =====================================

approvedTicketList?.addEventListener("click", async event => {
    const button = event.target.closest(".request-ticket-btn");

    if (!button) return;

    const supabase = window.ticketPassSupabase;

    if (!supabase) {
        alert("Supabase chưa sẵn sàng. Vui lòng tải lại trang.");
        return;
    }

    const ticketId = Number(button.dataset.ticketId);
    const sellerId = button.dataset.sellerId;

    if (!ticketId || !sellerId) {
        alert("Thông tin vé không hợp lệ.");
        return;
    }

    button.disabled = true;
    button.textContent = "ĐANG GỬI...";

    try {
        const { data: userData, error: userError } =
            await supabase.auth.getUser();

        if (userError) throw userError;

        const user = userData.user;

        if (!user) {
            alert("Bạn cần đăng nhập để yêu cầu mua vé.");
            button.disabled = false;
            button.textContent = "YÊU CẦU MUA VÉ";
            return;
        }

        if (user.id === sellerId) {
            alert("Bạn không thể yêu cầu mua vé do chính mình đăng.");
            button.disabled = false;
            button.textContent = "YÊU CẦU MUA VÉ";
            return;
        }

        const { data: oldRequests, error: checkError } = await supabase
            .from("purchase_requests")
            .select("id, status")
            .eq("ticket_id", ticketId)
            .eq("buyer_id", user.id)
            .in("status", ["pending", "accepted"]);

        if (checkError) throw checkError;

        if (oldRequests && oldRequests.length > 0) {
            alert("Bạn đã có yêu cầu mua vé này. Vui lòng chờ người bán phản hồi.");
            button.textContent = "ĐÃ GỬI YÊU CẦU";
            return;
        }

        const { error: insertError } = await supabase
            .from("purchase_requests")
            .insert({
                ticket_id: ticketId,
                buyer_id: user.id,
                seller_id: sellerId,
                status: "pending"
            });

        if (insertError) throw insertError;

        alert("Đã gửi yêu cầu mua vé thành công! Hãy chờ người bán phản hồi.");
        button.textContent = "ĐÃ GỬI YÊU CẦU";

    } catch (error) {
        console.error("Lỗi gửi yêu cầu mua vé:", error);

        alert("Không thể gửi yêu cầu mua vé: " + error.message);

        button.disabled = false;
        button.textContent = "YÊU CẦU MUA VÉ";
    }
});


// =====================================
// 15. HÀM HIỂN THỊ DỮ LIỆU AN TOÀN
// =====================================

function escapeTicketHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


// =====================================
// 16. SELLER - QUẢN LÝ YÊU CẦU MUA VÉ
// =====================================

(() => {
    const requestSection = document.getElementById(
        "seller-requests-section"
    );

    const requestList = document.getElementById(
        "seller-request-list"
    );

    if (!requestSection || !requestList) return;

    let isLoadingRequests = false;

    async function loadSellerRequests() {
        const supabase = window.ticketPassSupabase;

        if (!supabase || isLoadingRequests) return;

        isLoadingRequests = true;

        try {
            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError) throw userError;

            const user = userData.user;

            if (!user) {
                requestSection.hidden = true;
                return;
            }

            requestSection.hidden = false;
            requestList.textContent = "Đang tải yêu cầu mua vé...";

            const { data: requests, error } = await supabase
                .from("purchase_requests")
                .select("*")
                .eq("seller_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!requests || requests.length === 0) {
                requestList.textContent =
                    "Bạn chưa nhận được yêu cầu mua vé nào.";
                return;
            }

            const ticketIds = [
                ...new Set(requests.map(item => item.ticket_id))
            ];

            const { data: tickets, error: ticketError } = await supabase
                .from("tickets")
                .select("id, movie, cinema, screening_date, screening_time")
                .in("id", ticketIds);

            if (ticketError) throw ticketError;

            const ticketMap = new Map(
                (tickets || []).map(ticket => [
                    String(ticket.id),
                    ticket
                ])
            );

            requestList.replaceChildren();

            requests.forEach(request => {
                const ticket = ticketMap.get(String(request.ticket_id));

                const card = document.createElement("article");
                card.className = "seller-request-card";
                card.dataset.requestId = request.id;

                const title = createElement(
                    "h3",
                    "",
                    ticket?.movie || "Vé không còn tồn tại"
                );

                const cinema = createElement(
                    "p",
                    "",
                    "Rạp: " + (ticket?.cinema || "Không có thông tin")
                );

                const screening = createElement(
                    "p",
                    "",
                    "Suất chiếu: " +
                    (ticket?.screening_date || "?") +
                    " - " +
                    (ticket?.screening_time || "?")
                );

                const buyer = createElement(
                    "p",
                    "",
                    "Mã người mua: " +
                    String(request.buyer_id).slice(0, 8) +
                    "..."
                );

                const statusNames = {
                    pending: "Đang chờ phản hồi",
                    accepted: "Đã chấp nhận",
                    rejected: "Đã từ chối",
                    cancelled: "Đã hủy",
                    completed: "Đã hoàn tất",
                    disputed: "Đang có tranh chấp"
                };

                const status = createElement(
                    "p",
                    "seller-request-status",
                    "Trạng thái: " +
                    (statusNames[request.status] || request.status)
                );

                card.append(title, cinema, screening, buyer, status);

                if (request.status === "pending") {
                    const actions = createElement(
                        "div",
                        "seller-request-actions"
                    );

                    const acceptButton = createElement(
                        "button",
                        "seller-accept-button",
                        "CHẤP NHẬN"
                    );

                    acceptButton.type = "button";
                    acceptButton.dataset.action = "accepted";

                    const rejectButton = createElement(
                        "button",
                        "seller-reject-button",
                        "TỪ CHỐI"
                    );

                    rejectButton.type = "button";
                    rejectButton.dataset.action = "rejected";

                    actions.append(acceptButton, rejectButton);
                    card.appendChild(actions);
                }

                requestList.appendChild(card);
            });

        } catch (error) {
            console.error("Lỗi tải yêu cầu mua vé:", error);

            requestList.textContent =
                "Không thể tải yêu cầu mua vé: " + error.message;

        } finally {
            isLoadingRequests = false;
        }
    }

    requestList.addEventListener("click", async event => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const card = button.closest(".seller-request-card");
        const requestId = card?.dataset.requestId;
        const newStatus = button.dataset.action;

        if (
            !requestId ||
            !["accepted", "rejected"].includes(newStatus)
        ) {
            return;
        }

        const supabase = window.ticketPassSupabase;

        if (!supabase) {
            alert("Chưa kết nối Supabase.");
            return;
        }

        const confirmMessage = newStatus === "accepted"
            ? "Bạn có chắc muốn chấp nhận yêu cầu này?"
            : "Bạn có chắc muốn từ chối yêu cầu này?";

        if (!confirm(confirmMessage)) return;

        const buttons = card.querySelectorAll("button");
        buttons.forEach(item => item.disabled = true);

        try {
            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError) throw userError;

            const user = userData.user;

            if (!user) {
                throw new Error("Vui lòng đăng nhập.");
            }

            if (newStatus === "accepted") {
                const { data, error } = await supabase.rpc(
                    "accept_purchase_request",
                    {
                        p_request_id: Number(requestId)
                    }
                );

                if (error) throw error;

                if (!data) {
                    throw new Error("Không tạo được phòng chat.");
                }

                alert(
                    "Đã chấp nhận yêu cầu! Phòng chat đã được tạo."
                );

                await loadConversationsForChat();

            } else {
                const { data, error } = await supabase
                    .from("purchase_requests")
                    .update({ status: "rejected" })
                    .eq("id", requestId)
                    .eq("seller_id", user.id)
                    .eq("status", "pending")
                    .select("id")
                    .maybeSingle();

                if (error) throw error;

                if (!data) {
                    alert(
                        "Yêu cầu này không còn ở trạng thái chờ xử lý."
                    );
                } else {
                    alert("Đã từ chối yêu cầu mua vé!");
                }
            }

            await loadSellerRequests();
            await loadApprovedTickets();

        } catch (error) {
            console.error("Lỗi xử lý yêu cầu:", error);

            alert("Không thể xử lý yêu cầu: " + error.message);

            buttons.forEach(item => item.disabled = false);
        }
    });

    window.addEventListener(
        "ticket-pass-supabase-ready",
        loadSellerRequests
    );

    document.addEventListener(
        "DOMContentLoaded",
        loadSellerRequests
    );

    if (window.ticketPassSupabase) {
        loadSellerRequests();
    }

    window.loadSellerRequests = loadSellerRequests;
})();

async function loadConversationsForChat() {
    if (typeof window.ticketPassLoadConversations === "function") {
        await window.ticketPassLoadConversations();
    }
}

// =====================================
// 17. ĐỒNG BỘ SUPABASE
// =====================================

window.addEventListener("ticket-pass-supabase-ready", () => {
    loadCommunityPosts();
    loadNotifications();
    loadApprovedTickets();

    if (typeof window.loadSellerRequests === "function") {
        window.loadSellerRequests();
    }

    loadConversationsForChat();
});

window.addEventListener("ticketpass-profile-updated", () => {
    loadCommunityPosts();
    loadNotifications();
    loadConversationsForChat();
});

if (window.ticketPassSupabase) {
    loadCommunityPosts();
    loadNotifications();
    loadApprovedTickets();
}


// =====================================
// 19. TRUNG TÂM GIAO DỊCH
// =====================================

(() => {
    const transactionList = document.getElementById("transaction-list");

    if (!transactionList) return;

    const filterButtons = document.querySelectorAll(
        "#transactions [data-filter]"
    );

    let allTransactions = [];
    let currentFilter = "all";

    const statusNames = {
        pending: "Đang chờ phản hồi",
        accepted: "Đang xử lý",
        rejected: "Đã bị từ chối",
        cancelled: "Đã hủy",
        completed: "Đã hoàn tất",
        disputed: "Đang có tranh chấp"
    };

    function renderTransactions() {
        transactionList.replaceChildren();

        let filtered = allTransactions;

        if (currentFilter === "buy") {
            filtered = allTransactions.filter(
                item => item.role === "buy"
            );
        }

        if (currentFilter === "sell") {
            filtered = allTransactions.filter(
                item => item.role === "sell"
            );
        }

        if (currentFilter === "history") {
            filtered = allTransactions.filter(
                item => ["completed", "rejected", "cancelled"]
                    .includes(item.status)
            );
        }

        if (filtered.length === 0) {
            transactionList.textContent =
                "Chưa có giao dịch nào trong mục này.";
            return;
        }

        filtered.forEach(item => {
            const ticket = item.ticket;

            const card = createElement(
                "article",
                "transaction-card"
            );

            const heading = createElement(
                "h3",
                "transaction-title",
                ticket?.movie || "Vé không còn tồn tại"
            );

            const role = createElement(
                "p",
                "transaction-role",
                item.role === "buy"
                    ? "Bạn là người mua"
                    : "Bạn là người bán"
            );

            const cinema = createElement(
                "p",
                "",
                "Rạp: " + (ticket?.cinema || "Không có thông tin")
            );

            const screening = createElement(
                "p",
                "",
                "Suất chiếu: " +
                (ticket?.screening_date || "Chưa rõ") +
                " - " +
                (ticket?.screening_time || "Chưa rõ")
            );

            const price = createElement(
                "p",
                "",
                "Giá vé: " +
                (
                    ticket?.price != null
                        ? Number(ticket.price).toLocaleString("vi-VN") + " VNĐ"
                        : "Không có thông tin"
                )
            );

            const otherPerson = createElement(
                "p",
                "",
                (item.role === "buy" ? "Người bán: " : "Người mua: ") +
                (item.otherName || "Thành viên TICKET PASS")
            );

            const status = createElement(
                "p",
                "transaction-status",
                "Trạng thái: " +
                (statusNames[item.status] || item.status)
            );

           
const date = createElement(
    "small",
    "transaction-date",
    "Ngày tạo: " + formatDate(item.created_at)
);

// Kiểm tra xác nhận của hai bên
const ownConfirmedAt = item.role === "buy"
    ? item.buyer_confirmed_at
    : item.seller_confirmed_at;

const otherConfirmedAt = item.role === "buy"
    ? item.seller_confirmed_at
    : item.buyer_confirmed_at;

const confirmationInfo = createElement(
    "p",
    "transaction-confirmation",
    ownConfirmedAt
        ? "Bạn đã xác nhận hoàn tất."
        : "Bạn chưa xác nhận hoàn tất."
);

if (otherConfirmedAt) {
    confirmationInfo.textContent +=
        " Người còn lại đã xác nhận.";
} else if (item.status === "accepted") {
    confirmationInfo.textContent +=
        " Người còn lại chưa xác nhận.";
}

let confirmButton = null;

if (item.status === "accepted" && !ownConfirmedAt) {
    confirmButton = createElement(
        "button",
        "transaction-confirm-button",
        "XÁC NHẬN HOÀN TẤT"
    );

    confirmButton.addEventListener("click", async () => {
        const client = window.ticketPassSupabase;

        confirmButton.disabled = true;
        confirmButton.textContent = "ĐANG XỬ LÝ...";

        try {
            const { data, error } = await client.rpc(
                "confirm_purchase_request",
                {
                    p_request_id: item.id
                }
            );

            if (error) throw error;

            if (data === "completed") {
                alert("Cả hai bên đã xác nhận. Giao dịch hoàn tất!");
            } else {
                alert("Bạn đã xác nhận. Đang chờ người còn lại xác nhận.");
            }

            await loadTransactions();

        } catch (error) {
            console.error("Lỗi xác nhận giao dịch:", error);
            alert("Không thể xác nhận: " + error.message);

            confirmButton.disabled = false;
            confirmButton.textContent = "XÁC NHẬN HOÀN TẤT";
        }
    });
}

card.append(
    heading,
    role,
    cinema,
    screening,
    price,
    otherPerson,
    status,
    date,
    confirmationInfo
);

if (confirmButton) {
    card.appendChild(confirmButton);
}


            transactionList.appendChild(card);
        });
    }

    async function loadTransactions() {
        const supabase = window.ticketPassSupabase;

        if (!supabase) return;

        transactionList.textContent = "Đang tải giao dịch...";

        try {
            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError) throw userError;

            const user = userData.user;

            if (!user) {
                allTransactions = [];
                transactionList.textContent =
                    "Vui lòng đăng nhập để xem giao dịch.";
                return;
            }

            const { data: requests, error } = await supabase
                .from("purchase_requests")
                .select("*")
                .or(
                    `buyer_id.eq.${user.id},seller_id.eq.${user.id}`
                )
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!requests || requests.length === 0) {
                allTransactions = [];
                renderTransactions();
                return;
            }

            const ticketIds = [
                ...new Set(requests.map(item => item.ticket_id))
            ];

            const userIds = [
                ...new Set(
                    requests.map(item =>
                        item.buyer_id === user.id
                            ? item.seller_id
                            : item.buyer_id
                    )
                )
            ];

            const { data: tickets, error: ticketError } =
                await supabase
                    .from("tickets")
                    .select(
                        "id, movie, cinema, screening_date, screening_time, price"
                    )
                    .in("id", ticketIds);

            if (ticketError) throw ticketError;

            const { data: profiles, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("user_id, display_name")
                    .in("user_id", userIds);

            if (profileError) throw profileError;

            const ticketMap = new Map(
                (tickets || []).map(ticket => [
                    String(ticket.id),
                    ticket
                ])
            );

            const profileMap = new Map(
                (profiles || []).map(profile => [
                    profile.user_id,
                    profile.display_name
                ])
            );

            allTransactions = requests.map(request => {
                const isBuyer = request.buyer_id === user.id;

                const otherId = isBuyer
                    ? request.seller_id
                    : request.buyer_id;

                return {
                    ...request,
                    role: isBuyer ? "buy" : "sell",
                    otherName:
                        profileMap.get(otherId) ||
                        "Thành viên TICKET PASS",
                    ticket: ticketMap.get(String(request.ticket_id))
                };
            });

            renderTransactions();

        } catch (error) {
            console.error("Lỗi tải giao dịch:", error);

            transactionList.textContent =
                "Không thể tải giao dịch: " + error.message;
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter;

            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            renderTransactions();
        });
    });

    window.addEventListener(
        "ticket-pass-supabase-ready",
        loadTransactions
    );

    window.addEventListener(
        "ticketpass-profile-updated",
        loadTransactions
    );

    if (window.ticketPassSupabase) {
        loadTransactions();
    }

    window.ticketPassLoadTransactions = loadTransactions;
})();



// =====================================
// 18. TICKET PASS - CHAT BUYER / SELLER
// =====================================

(() => {
    const supabase = () => window.ticketPassSupabase;

    const chatSection = document.getElementById("chat-section");
    const conversationList = document.getElementById("conversation-list");
    const chatTitle = document.getElementById("chat-title");
    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatSend = document.getElementById("chat-send");
    const refreshButton = document.getElementById("refresh-conversations");

    if (
        !chatSection ||
        !conversationList ||
        !chatTitle ||
        !chatMessages ||
        !chatForm ||
        !chatInput ||
        !chatSend
    ) return;

    let currentUser = null;
    let currentConversationId = null;
    let conversations = [];

    function addChatText(parent, tag, className, value) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = value ?? "";
        parent.appendChild(element);
        return element;
    }

    
async function loadConversations() {
    const client = supabase();

    if (!client) return;

    try {
        const { data: userData, error: userError } =
            await client.auth.getUser();

        if (userError) throw userError;

        currentUser = userData.user;

        if (!currentUser) {
            chatSection.hidden = true;
            conversations = [];
            return;
        }

        chatSection.hidden = false;
        conversationList.textContent = "Đang tải...";

        const { data, error } = await client
            .from("conversations")
            .select("*")
            .or(
                `buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`
            )
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Lấy cuộc trò chuyện mới nhất của mỗi người
        const latestByUser = new Map();

        (data || []).forEach(conversation => {
            const otherId =
                conversation.buyer_id === currentUser.id
                    ? conversation.seller_id
                    : conversation.buyer_id;

            if (!latestByUser.has(otherId)) {
                latestByUser.set(otherId, conversation);
            }
        });

        conversations = [...latestByUser.values()];

        conversationList.replaceChildren();

        if (conversations.length === 0) {
            conversationList.textContent =
                "Bạn chưa có cuộc trò chuyện nào.";
            return;
        }

        const otherUserIds = [
            ...new Set(
                conversations.map(item =>
                    item.buyer_id === currentUser.id
                        ? item.seller_id
                        : item.buyer_id
                )
            )
        ];

        const { data: profiles, error: profileError } = await client
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", otherUserIds);

        if (profileError) throw profileError;

        const profileMap = new Map(
            (profiles || []).map(profile => [
                profile.user_id,
                profile.display_name
            ])
        );

        conversations.forEach(conversation => {
            const otherId =
                conversation.buyer_id === currentUser.id
                    ? conversation.seller_id
                    : conversation.buyer_id;

            const name =
                profileMap.get(otherId) || "Thành viên TICKET PASS";

            const button = addChatText(
                conversationList,
                "button",
                "conversation-item",
                name
            );

            button.type = "button";

            if (
                String(conversation.id) ===
                String(currentConversationId)
            ) {
                button.classList.add("active");
            }

            button.addEventListener("click", () => {
                openConversation(conversation, name);
            });
        });

    } catch (error) {
        console.error("Lỗi tải cuộc trò chuyện:", error);

        conversationList.textContent =
            "Không thể tải cuộc trò chuyện: " + error.message;
    }
}

   async function openConversation(conversation, name) {
    currentConversationId = conversation.id;

    chatTitle.textContent = "Đang trò chuyện với " + name;
    chatMessages.textContent = "Đang tải tin nhắn...";

    chatInput.disabled = false;
    chatSend.disabled = false;

    chatSection.hidden = false;

    // Hủy kết nối cũ nếu chuyển sang cuộc trò chuyện khác
    if (window.ticketPassChatChannel) {
        await supabase().removeChannel(
            window.ticketPassChatChannel
        );
        window.ticketPassChatChannel = null;
    }

    await loadMessages();
    await loadConversations();

    // Đăng ký nhận tin nhắn mới
    window.ticketPassChatChannel = supabase()
        .channel("chat-" + conversation.id)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: "conversation_id=eq." + conversation.id
            },
           async (payload) => {
    if (
        String(payload.new.conversation_id) ===
        String(currentConversationId)
    ) {
        await loadMessages();
    }
}
        )
        .subscribe((status, error) => {
            //alert("Realtime status: " + status);
    console.log("CHAT REALTIME:", status, error || "");

    if (status === "SUBSCRIBED") {
        console.log("ĐÃ KẾT NỐI REALTIME:", conversation.id);
    }

    if (status === "CHANNEL_ERROR") {
        console.error("LỖI REALTIME:", error);
    }
});
}
    // CHO PHÉP MỞ CHAT TỪ THÔNG BÁO
    window.ticketPassOpenConversation = async function (conversationId) {
        await loadConversations();

        const conversation = conversations.find(
            item => String(item.id) === String(conversationId)
        );

        if (!conversation) {
            alert("Không tìm thấy cuộc trò chuyện.");
            return;
        }

        const otherId =
            conversation.buyer_id === currentUser.id
                ? conversation.seller_id
                : conversation.buyer_id;

        const { data: profile, error } = await supabase()
            .from("profiles")
            .select("display_name")
            .eq("user_id", otherId)
            .maybeSingle();

        if (error) {
            console.error("Lỗi tải tên thành viên:", error);
        }

        const name =
            profile?.display_name || "Thành viên TICKET PASS";

       chatSection.hidden = false;

await openConversation(conversation, name);

// Đưa cửa sổ chat vào giữa màn hình
requestAnimationFrame(() => {
    chatSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});
    };

    async function loadMessages() {
        const client = supabase();

        if (!client || !currentConversationId || !currentUser) return;

        try {
            const { data, error } = await client
                .from("messages")
                .select("id, sender_id, content, created_at")
                .eq("conversation_id", currentConversationId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            chatMessages.replaceChildren();

            if (!data || data.length === 0) {
                chatMessages.textContent = "Chưa có tin nhắn.";
                return;
            }

            data.forEach(message => {
                const mine = message.sender_id === currentUser.id;

                const item = addChatText(
                    chatMessages,
                    "div",
                    mine ? "chat-message mine" : "chat-message",
                    message.content
                );

                addChatText(
                    item,
                    "small",
                    "chat-message-time",
                    new Date(message.created_at).toLocaleString("vi-VN")
                );
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;

        } catch (error) {
            console.error("Lỗi tải tin nhắn:", error);

            chatMessages.textContent =
                "Không thể tải tin nhắn: " + error.message;
        }
    }

    chatForm.addEventListener("submit", async event => {
        event.preventDefault();

        const client = supabase();
        const content = chatInput.value.trim();

        if (!client || !currentUser || !currentConversationId || !content) {
            return;
        }

        chatSend.disabled = true;

        try {
            const { error } = await client
                .from("messages")
                .insert({
                    conversation_id: currentConversationId,
                    sender_id: currentUser.id,
                    content: content
                });

            if (error) throw error;

            chatInput.value = "";

            await loadMessages();

        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);

            alert("Không thể gửi tin nhắn: " + error.message);

        } finally {
            chatSend.disabled = false;
        }
    });

    refreshButton?.addEventListener("click", async () => {
        await loadConversations();
        await loadMessages();
    });

    window.ticketPassLoadConversations = loadConversations;
    window.addEventListener(
        "ticketpass-profile-updated",
        loadConversations
    );

    if (supabase()) {
        loadConversations();
    }
})();

/* =====================================
   20. QUẢN LÝ VÉ CÁ NHÂN
===================================== */

(() => {
    const ticketList = document.getElementById("my-ticket-list");

    if (!ticketList) return;

    const filterButtons = document.querySelectorAll(
        "#my-tickets [data-ticket-filter]"
    );

    let myTickets = [];
    let currentTicketFilter = "all";

    const statusNames = {
        pending_review: "Đang chờ admin duyệt",
        available: "Đang được rao bán",
        sold: "Đã bán",
        rejected: "Đã bị từ chối"
    };

    function renderMyTickets() {
        ticketList.replaceChildren();

        let filteredTickets = myTickets;

        if (currentTicketFilter !== "all") {
            filteredTickets = myTickets.filter(
                ticket => ticket.status === currentTicketFilter
            );
        }

        if (filteredTickets.length === 0) {
            ticketList.textContent =
                "Bạn chưa có vé nào trong mục này.";
            return;
        }

        filteredTickets.forEach(ticket => {
            const card = document.createElement("article");
            card.className = "my-ticket-card";

            const title = document.createElement("h3");
            title.textContent = ticket.movie || "Vé xem phim";

            const cinema = document.createElement("p");
            cinema.textContent = "Rạp: " + (ticket.cinema || "Chưa rõ");

            const screening = document.createElement("p");
            screening.textContent =
                "Suất chiếu: " +
                (ticket.screening_date || "Chưa rõ") +
                " - " +
                (ticket.screening_time || "Chưa rõ");

            const price = document.createElement("p");
            price.textContent =
                "Giá vé: " +
                (
                    ticket.price != null
                        ? Number(ticket.price).toLocaleString("vi-VN") + " VNĐ"
                        : "Chưa có giá"
                );

            const status = document.createElement("p");
            status.className = "my-ticket-status";
            status.textContent =
                "Trạng thái: " +
                (statusNames[ticket.status] || ticket.status);

            card.append(title, cinema, screening, price, status);

            ticketList.appendChild(card);
        });
    }

    async function loadMyTickets() {
        const supabase = window.ticketPassSupabase;

        if (!supabase) return;

        ticketList.textContent = "Đang tải vé của bạn...";

        try {
            const { data: userData, error: userError } =
                await supabase.auth.getUser();

            if (userError) throw userError;

            const user = userData.user;

            if (!user) {
                myTickets = [];
                ticketList.textContent =
                    "Vui lòng đăng nhập để quản lý vé.";
                return;
            }

            const { data, error } = await supabase
                .from("tickets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            myTickets = data || [];

            renderMyTickets();

        } catch (error) {
            console.error("Lỗi tải vé cá nhân:", error);

            ticketList.textContent =
                "Không thể tải vé: " + error.message;
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentTicketFilter =
                button.dataset.ticketFilter;

            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            renderMyTickets();
        });
    });

    window.addEventListener(
        "ticketpass-supabase-ready",
        loadMyTickets
    );

    window.addEventListener(
        "ticketpass-profile-updated",
        loadMyTickets
    );

    if (window.ticketPassSupabase) {
        loadMyTickets();
    }

    window.ticketPassLoadMyTickets = loadMyTickets;
})();
