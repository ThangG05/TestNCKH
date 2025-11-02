// =========================================================================
// CÁC CLASS CƠ BẢN (Table of Contents, Header, Image Handler)
// =========================================================================

// Table of Contents - Scroll Spy and Navigation
class TableOfContents {
    constructor() {
        this.links = document.querySelectorAll('.toc-link');
        this.sections = Array.from(this.links)
            .map(link => document.getElementById(link.dataset.section))
            .filter(section => section !== null);

        this.offset = 120;
        this.ticking = false;
        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToSection(link.dataset.section);
            });
        });

        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateActiveLink();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });

        this.updateActiveLink();
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const sectionTop = section.offsetTop - this.offset;
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveLink() {
        const scrollPosition = window.scrollY + this.offset;
        let activeIndex = -1;

        for (let i = this.sections.length - 1; i >= 0; i--) {
            const section = this.sections[i];
            if (section && scrollPosition >= section.offsetTop) {
                activeIndex = i;
                break;
            }
        }

        if (activeIndex !== -1) {
            this.setActiveLink(this.links[activeIndex]);
        } else if (window.scrollY < (this.sections[0]?.offsetTop - this.offset || 0)) {
             this.links.forEach(link => link.classList.remove('active'));
        }
    }

    setActiveLink(activeLink) {
        this.links.forEach(link => link.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Image Handler (giữ nguyên)
class ImageHandler {
    constructor() {
        this.images = document.querySelectorAll('.step-image');
        this.init();
    }

    init() {
        this.images.forEach(img => {
            const placeholder = img.getAttribute('data-placeholder');
            if (placeholder) {
                img.setAttribute('title', placeholder);
            }
            if (!img.getAttribute('alt') && placeholder) {
                 img.setAttribute('alt', `Hình ảnh: ${placeholder}`);
            }
        });
    }
}

// Smooth scroll (giữ nguyên)
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]:not(.toc-link)');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    const offset = 120;
                    const targetTop = target.offsetTop - offset;
                    window.scrollTo({
                        top: targetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }
}

// Logic Header Kính Mờ
function setupScrollHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let isScrolled = false;

    function handleScroll() {
        const shouldBeScrolled = window.scrollY > 5; 

        if (shouldBeScrolled && !isScrolled) {
            header.classList.add('scrolled');
            isScrolled = true;
        } else if (!shouldBeScrolled && isScrolled) {
            header.classList.remove('scrolled');
            isScrolled = false;
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
}


// =========================================================================
// CHATBOT LOGIC VÀ TÍCH HỢP GEMINI API (ĐÃ LÀM SẠCH)
// =========================================================================

// KHÓA API CỦA BẠN (Dán lại khóa API mới nếu khóa cũ bị lỗi)
const GEMINI_API_KEY = "AIzaSyAyvccfzktdpkKiilheFD6tyzJAuGTWp7E"; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;


let chatHistory = [
    {
        role: "user",
        parts: [{ text: "Bạn là một trợ lý AI thông minh, nhiệt tình và hữu ích. Hãy trả lời mọi câu hỏi của người dùng một cách chính xác và thân thiện. Nếu câu hỏi liên quan đến tài liệu hướng dẫn, hãy cố gắng tham khảo thông tin đã được cung cấp." }]
    },
    {
        role: "model",
        parts: [{ text: "Chào bạn, tôi là trợ lý AI. Tôi sẵn lòng giúp bạn giải đáp mọi thắc mắc, dù là về tài liệu hướng dẫn hay bất kỳ chủ đề nào khác. Hãy hỏi tôi bất cứ điều gì!" }]
    }
];


function setupChatbot() {
    const fabButton = document.getElementById('openChat');
    const closeButton = document.getElementById('closeChat');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const chatBody = document.getElementById('chatbotBody');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');

    // Cảnh báo nếu API Key chưa được điền hoặc đang là giá trị mặc định
    if (!fabButton || !chatbotContainer || GEMINI_API_KEY === "YOUR_API_KEY_HERE" || !GEMINI_API_KEY) {
        console.error("Lỗi: Vui lòng điền Khóa API Gemini hợp lệ.");
        if (fabButton) fabButton.disabled = true;
        return;
    }

    // 1. Mở/Đóng Chatbot
    fabButton.addEventListener('click', () => {
        chatbotContainer.classList.add('open');
        fabButton.style.display = 'none'; 
        chatInput.focus();
    });

    closeButton.addEventListener('click', () => {
        chatbotContainer.classList.remove('open');
        fabButton.style.display = 'flex'; 
    });

    // 2. Xử lý Gửi tin nhắn
    async function sendMessage() {
        const userText = chatInput.value.trim();
        if (userText === "") return;

        appendMessage(userText, 'user');
        chatHistory.push({ role: "user", parts: [{ text: userText }] });

        chatInput.value = '';
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        const typingIndicator = appendMessage('...', 'bot', true); 

        try {
            const botResponse = await getGeminiResponse();
            
            chatBody.removeChild(typingIndicator); 
            appendMessage(botResponse, 'bot');
            
            chatHistory.push({ role: "model", parts: [{ text: botResponse }] });

        } catch (error) {
            console.error("Lỗi gọi API Gemini:", error);
            chatBody.removeChild(typingIndicator); 
            // HIỂN THỊ LỖI KẾT NỐI (Đây là lỗi mà bạn đang thấy)
            appendMessage("Xin lỗi, có lỗi xảy ra khi kết nối với AI. (Kiểm tra CORS hoặc Khóa API)", 'bot'); 
            chatHistory.pop(); 
        } finally {
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Hàm gọi API Gemini
    async function getGeminiResponse() {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: chatHistory, 
                config: {
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            // Lỗi HTTP (400, 403, 429...)
            throw new Error(`API response status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
             return data.candidates[0].content.parts[0].text;
        } else {
             return "Tôi không hiểu rõ câu hỏi của bạn. Vui lòng diễn đạt lại.";
        }
    }

    // Hàm thêm tin nhắn vào khung chat
    function appendMessage(text, sender, isTyping = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender + '-message');
        
        if (isTyping) {
            messageDiv.classList.add('typing-indicator');
            messageDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>'; 
        } else {
            messageDiv.textContent = text;
        }

        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        return messageDiv;
    }
    
    // Khởi tạo tin nhắn chào mừng
    appendMessage("Chào bạn, tôi là trợ lý AI. Tôi sẵn lòng giúp bạn giải đáp mọi thắc mắc, dù là về tài liệu hướng dẫn hay bất kỳ chủ đề nào khác. Hãy hỏi tôi bất cứ điều gì!", 'bot');
}


// Khởi tạo tất cả chức năng khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
    new TableOfContents();
    new ImageHandler();
    new SmoothScroll();
    setupScrollHeader(); 
    setupChatbot(); 

    console.log('Tất cả chức năng (TOC, Header, Chatbot) đã được khởi tạo thành công.');
});