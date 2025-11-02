// Table of Contents - Scroll Spy and Navigation
class TableOfContents {
    constructor() {
        this.links = document.querySelectorAll('.toc-link');
        this.sections = Array.from(this.links)
            .map(link => document.getElementById(link.dataset.section))
            .filter(section => section !== null); // Lọc bỏ các section không tồn tại

        this.offset = 120; // Tăng offset để header sticky không che mất tiêu đề
        this.ticking = false;
        this.init();
    }

    init() {
        // Add click listeners to TOC links
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                this.scrollToSection(sectionId);
            });
        });

        // Add scroll listener for active state (Sử dụng requestAnimationFrame để tối ưu hiệu suất)
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                window.requestAnimationFrame(() => {
                    this.updateActiveLink();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });

        // Initial update
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
        // Vị trí cuộn hiện tại + offset (để xác định phần đang nằm trên đầu trang, không bị header che)
        const scrollPosition = window.scrollY + this.offset;

        let activeIndex = -1;

        // Lặp ngược từ cuối để xác định section hiện tại
        for (let i = this.sections.length - 1; i >= 0; i--) {
            const section = this.sections[i];
            if (section && scrollPosition >= section.offsetTop) {
                activeIndex = i;
                break;
            }
        }

        // Cập nhật trạng thái active
        if (activeIndex !== -1) {
            this.setActiveLink(this.links[activeIndex]);
        } else if (window.scrollY < this.sections[0].offsetTop - this.offset) {
             // Nếu đang ở đầu trang, xóa active
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

// Image Handler - Auto-populate image URLs
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
                // Dòng này được giữ lại để đảm bảo hình ảnh hiển thị đúng
            }

            // Tự động thêm alt nếu chưa có (dựa vào data-placeholder)
            if (!img.getAttribute('alt') && placeholder) {
                 img.setAttribute('alt', `Hình ảnh: ${placeholder}`);
            }
        });
    }

    // Phương thức giữ lại cho khả năng mở rộng
    replaceImage(imageName, newSrc) {
        this.images.forEach(img => {
            if (img.alt.includes(imageName) || img.getAttribute('data-placeholder').includes(imageName)) {
                img.src = newSrc;
                img.style.display = 'block';
            }
        });
    }

    // Phương thức giữ lại cho khả năng mở rộng
    replaceAllImages(imageMap) {
        Object.entries(imageMap).forEach(([altText, src]) => {
            this.replaceImage(altText, src);
        });
    }
}

// Smooth scroll for anchor links (chủ yếu cho các link #, giữ lại cho tính nhất quán)
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            // Kiểm tra xem click có phải là trên link anchor (không phải nút TOC) không
            const link = e.target.closest('a[href^="#"]:not(.toc-link)');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    const offset = 120; // Đồng bộ offset với TOC
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new TableOfContents();
    new ImageHandler();
    new SmoothScroll();

    console.log('Hướng dẫn NCKH: Giao diện đã được khởi tạo thành công.');
});
