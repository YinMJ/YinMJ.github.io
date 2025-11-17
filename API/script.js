// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // 添加侧边栏交互
    addSidebarInteractions();
    
    // 添加卡片悬停效果
    addCardHoverEffects();
    
    // 添加按钮点击事件
    addButtonEvents();
    
    // 添加滚动动画
    addScrollAnimations();
    
    // 添加决策指南交互
    addGuideInteractions();
}

// 侧边栏交互
function addSidebarInteractions() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const inviteButton = document.querySelector('.invite-button');
    const footerCards = document.querySelectorAll('.footer-card');
    
    // 汉堡菜单切换
    if (hamburgerMenu && sidebar) {
        hamburgerMenu.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
    
    // 导航项点击事件
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有active类
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // 添加active类到当前项
            this.classList.add('active');
            
            // 显示通知
            const itemText = this.textContent.trim();
            showNotification(`已选择：${itemText}`, 'info');
            
            // 在移动端点击后关闭侧边栏
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
            }
        });
    });
    
    // 邀请按钮点击事件
    if (inviteButton) {
        inviteButton.addEventListener('click', function() {
            showNotification('邀请功能开发中...', 'info');
        });
    }
    
    // 底部卡片点击事件
    footerCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const cardText = this.querySelector('span').textContent;
            showNotification(`正在打开${cardText}...`, 'info');
        });
    });
    
    // 点击外部关闭侧边栏（移动端）
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // 窗口大小改变时处理侧边栏
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('open');
        }
    });
}

// 卡片悬停效果
function addCardHoverEffects() {
    const cards = document.querySelectorAll('.api-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 按钮点击事件
function addButtonEvents() {
    // 进入控制台按钮（排除下拉菜单和其他按钮）
    const allPrimaryBtns = document.querySelectorAll('.btn-primary');
    allPrimaryBtns.forEach(btn => {
        // 排除下拉菜单中的按钮和"我的调用记录"按钮
        if (!btn.closest('.dropdown-wrapper') && !btn.textContent.includes('我的调用记录')) {
            btn.addEventListener('click', function() {
                showNotification('正在进入控制台...', 'info');
                // 这里可以添加实际的跳转逻辑
                // window.open('控制台URL', '_blank');
            });
        }
    });
    
    // 我的调用记录按钮
    const allPrimaryBtnsForHistory = document.querySelectorAll('.btn-primary');
    allPrimaryBtnsForHistory.forEach(btn => {
        if (btn.textContent.includes('我的调用记录')) {
            btn.addEventListener('click', function() {
                showNotification('正在打开调用记录页面...', 'info');
                // 在新窗口打开调用记录页面
                setTimeout(() => {
                    window.open('call-history.html', '_blank');
                }, 500);
            });
        }
    });
    
    // 阻止下拉菜单按钮的默认点击行为
    const dropdownBtns = document.querySelectorAll('.dropdown-btn');
    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // 下拉菜单通过hover显示，不需要点击事件
            e.preventDefault();
        });
    });
    
    // 卡片详情按钮
    const cardBtns = document.querySelectorAll('.btn-card');
    cardBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const cardTypes = ['标准模型API', 'AI应用API', 'ComfyUI工作流API'];
            const pageUrls = ['standard-models.html', 'ai-apps-detail.html', 'comfyui-workflows-detail.html'];
            
            showNotification(`正在打开${cardTypes[index]}页面...`, 'info');
            
            // 在新窗口打开对应的详情页面
            setTimeout(() => {
                window.open(pageUrls[index], '_blank');
            }, 500);
        });
    });
}

// 滚动动画
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    const animatedElements = document.querySelectorAll('.api-card, .advantage-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// 决策指南交互
function addGuideInteractions() {
    const guideOptions = document.querySelectorAll('.guide-option');
    
    // 点击选项
    guideOptions.forEach(option => {
        option.addEventListener('click', function() {
            const apiType = this.getAttribute('data-type');
            const strongText = this.querySelector('strong').textContent;
            
            // 显示通知
            showNotification(`您选择了${strongText}，正在为您推荐相关API...`, 'success');
            
            // 高亮对应的卡片
            highlightCorrespondingCard(strongText);
            
            // 平滑滚动到对应的卡片
            const cards = document.querySelectorAll('.api-card');
            let targetCard = null;
            if (strongText.includes('标准模型API')) {
                targetCard = cards[0];
            } else if (strongText.includes('AI应用API')) {
                targetCard = cards[1];
            } else if (strongText.includes('ComfyUI工作流API')) {
                targetCard = cards[2];
            }
            
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

// 高亮对应的卡片
function highlightCorrespondingCard(titleText) {
    const cards = document.querySelectorAll('.api-card');
    
    // 移除所有卡片的高亮
    cards.forEach(card => {
        card.style.border = '';
        card.style.boxShadow = '';
        card.classList.remove('highlighted');
    });
    
    // 根据选择高亮对应卡片
    if (titleText.includes('标准模型API')) {
        cards[0].style.border = '2px solid #007aff';
        cards[0].style.boxShadow = '0 8px 24px rgba(0, 122, 255, 0.25)';
        cards[0].classList.add('highlighted');
    } else if (titleText.includes('AI应用API')) {
        cards[1].style.border = '2px solid #007aff';
        cards[1].style.boxShadow = '0 8px 24px rgba(0, 122, 255, 0.25)';
        cards[1].classList.add('highlighted');
    } else if (titleText.includes('ComfyUI工作流API')) {
        cards[2].style.border = '2px solid #007aff';
        cards[2].style.boxShadow = '0 8px 24px rgba(0, 122, 255, 0.25)';
        cards[2].classList.add('highlighted');
    }
    
    // 3秒后移除高亮
    setTimeout(() => {
        cards.forEach(card => {
            card.style.border = '';
            card.style.boxShadow = '';
            card.classList.remove('highlighted');
        });
    }, 3000);
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 14px;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'info': '#3b82f6',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444'
    };
    return colors[type] || '#3b82f6';
}

// 添加键盘导航支持
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        // 为键盘导航添加焦点样式
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('api-card')) {
            focusedElement.style.outline = '2px solid #3b82f6';
            focusedElement.style.outlineOffset = '2px';
        }
    }
});

// 添加触摸设备支持
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // 为触摸设备优化卡片交互
    const cards = document.querySelectorAll('.api-card');
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(-4px) scale(1.01)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 性能优化：防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化滚动事件
const optimizedScrollHandler = debounce(() => {
    // 这里可以添加滚动相关的优化逻辑
}, 16);

window.addEventListener('scroll', optimizedScrollHandler);
