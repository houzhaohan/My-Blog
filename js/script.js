// 博客应用主脚本
class BlogApp {
    constructor() {
        this.posts = [];
        this.currentPost = null;
        this.md = window.markdownit({
            html: true,
            linkify: true,
            typographer: true
        });
        
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.loadPosts();
        this.showSection('blog-list');
    }

    // 绑定事件监听器
    bindEvents() {
        // 导航链接点击事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // 返回按钮点击事件
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showSection('blog-list');
        });

        // 首页链接特殊处理
        document.querySelector('a[href="#home"]').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('blog-list');
        });
    }

    // 加载文章列表
    async loadPosts() {
        try {
            // 模拟从服务器加载文章列表
            const postsData = await this.fetchPosts();
            this.posts = postsData;
            this.renderPosts();
        } catch (error) {
            console.error('加载文章失败:', error);
            this.showError('加载文章失败，请刷新页面重试');
        }
    }

    // 获取文章列表
    async fetchPosts() {
        return new Promise((resolve, reject) => {
            // 从directory.json文件获取文章列表
            fetch('post/directory.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(posts => {
                    resolve(posts);
                })
                .catch(error => {
                    console.error('加载文章列表失败:', error);
                    reject(new Error('无法加载文章列表，请检查directory.json文件是否存在'));
                });
        });
    }

    // 渲染文章列表
    renderPosts() {
        const container = document.getElementById('posts-container');
        const countContainer = document.getElementById('posts-count');
        
        // 更新文章总数显示
        countContainer.innerHTML = `<div class="posts-count-text">共计 ${this.posts.length} 篇文章</div>`;
        
        if (this.posts.length === 0) {
            container.innerHTML = '<div class="loading">暂无文章</div>';
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post-card fade-in" onclick="blogApp.showPost('${post.id}')">
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-meta">
                    <span>${this.formatDate(post.date)}</span>
                    <a class="read-more">阅读全文 →</a>
                </div>
            </div>
        `).join('');
    }

    // 显示文章详情
    async showPost(postId) {
        try {
            const post = this.posts.find(p => p.id === postId);
            if (!post) {
                throw new Error('文章不存在');
            }

            this.currentPost = post;
            
            // 显示加载状态
            document.getElementById('article-content').innerHTML = '<div class="loading">加载中</div>';
            
            // 加载文章内容
            const content = await this.fetchPostContent(post.folder);
            const htmlContent = this.md.render(content);
            
            // 修复图片路径 - 将相对路径转换为绝对路径
            const fixedHtmlContent = this.fixImagePaths(htmlContent, post.folder);
            
            document.getElementById('article-content').innerHTML = `
                <h1>${post.title}</h1>
                <div class="post-date">
                    发布于 ${this.formatDate(post.date)}
                </div>
                ${fixedHtmlContent}
            `;
            
            this.showSection('blog-detail');
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('加载文章内容失败:', error);
            this.showError('加载文章内容失败');
        }
    }

    // 修复图片路径
    fixImagePaths(htmlContent, folderName) {
        // 使用正则表达式匹配所有img标签的src属性
        return htmlContent.replace(/src="([^"]+)"/g, (match, srcPath) => {
            // 如果路径已经是绝对路径或者以http开头，则不处理
            if (srcPath.startsWith('http') || srcPath.startsWith('/')) {
                return match;
            }
            
            // 将相对路径转换为绝对路径
            const absolutePath = `post/${folderName}/${srcPath}`;
            return `src="${absolutePath}"`;
        });
    }

    // 获取文章内容
    async fetchPostContent(folderName) {
        return new Promise((resolve, reject) => {
            // 构建Markdown文件路径
            const mdFilePath = `post/${folderName}/${folderName}.md`;
            
            // 使用fetch API获取Markdown文件
            fetch(mdFilePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(markdownContent => {
                    resolve(markdownContent);
                })
                .catch(error => {
                    console.error('加载Markdown文件失败:', error);
                    reject(new Error('无法加载文章内容，请检查文件是否存在'));
                });
        });
    }

    // 显示不同页面区域
    showSection(sectionId) {
        // 隐藏所有区域
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });

        // 显示目标区域
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // 添加淡入动画
            targetSection.classList.add('fade-in');
            setTimeout(() => {
                targetSection.classList.remove('fade-in');
            }, 600);
        }

        // 更新导航激活状态
        this.updateNavActiveState(sectionId);
    }

    // 更新导航激活状态
    updateNavActiveState(sectionId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 显示错误信息
    showError(message) {
        const container = document.getElementById('posts-container') || 
                         document.getElementById('article-content');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 1rem;
                    ">刷新页面</button>
                </div>
            `;
        }
    }
}

// 初始化博客应用
const blogApp = new BlogApp();

// 添加CSS样式到导航链接激活状态
const style = document.createElement('style');
style.textContent = `
    .nav-link.active {
        background-color: rgba(255,255,255,0.2) !important;
        font-weight: 600;
    }
    
    .post-card {
        transition: all 0.3s ease;
    }
    
    .post-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
`;
document.head.appendChild(style);

// 页面加载完成后的初始化
window.addEventListener('DOMContentLoaded', () => {
    // 检查URL hash，处理直接访问文章的情况
    const hash = window.location.hash;
    if (hash && hash.startsWith('#post')) {
        const postId = hash.substring(1);
        blogApp.showPost(postId);
    }
});
