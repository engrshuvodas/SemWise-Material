// Advanced Animation Library

// Animation controller
class AnimationController {
    constructor() {
        this.animations = [];
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.init();
    }
    
    init() {
        this.setupScrollListener();
        this.setupResizeListener();
        this.initAOS();
    }
    
    setupScrollListener() {
        window.addEventListener('scroll', () => {
            if (!this.isScrolling) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    this.isScrolling = false;
                });
                this.isScrolling = true;
            }
        });
    }
    
    setupResizeListener() {
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }
    
    handleScroll() {
        const scrollY = window.pageYOffset;
        this.updateParallax(scrollY);
        this.updateScrollAnimations(scrollY);
    }
    
    handleResize() {
        this.updateResponsiveAnimations();
    }
    
    debounce(func, wait) {
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
    
    // Parallax scrolling
    updateParallax(scrollY) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }
    
    // Scroll-triggered animations
    updateScrollAnimations(scrollY) {
        const elements = document.querySelectorAll('[data-animate]');
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible && !element.classList.contains('animated')) {
                this.triggerAnimation(element);
            }
        });
    }
    
    triggerAnimation(element) {
        const animationType = element.dataset.animate || 'fadeIn';
        element.classList.add('animated', animationType);
        
        // Add completion callback if specified
        if (element.dataset.callback) {
            const callback = window[element.dataset.callback];
            if (typeof callback === 'function') {
                setTimeout(callback, 1000);
            }
        }
    }
    
    // Initialize AOS-like functionality
    initAOS() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('[data-aos]').forEach(element => {
            observer.observe(element);
        });
    }
    
    animateElement(element) {
        const animation = element.dataset.aos || 'fade-up';
        const duration = element.dataset.aosDuration || 600;
        const delay = element.dataset.aosDelay || 0;
        
        element.style.animationDuration = `${duration}ms`;
        element.style.animationDelay = `${delay}ms`;
        element.classList.add('aos-animate', animation);
    }
    
    updateResponsiveAnimations() {
        const isMobile = window.innerWidth < 768;
        
        document.querySelectorAll('[data-responsive]').forEach(element => {
            if (isMobile) {
                element.classList.add('mobile-optimized');
            } else {
                element.classList.remove('mobile-optimized');
            }
        });
    }
}

// GSAP-like animation functions
class GSAPLite {
    static to(element, duration, properties) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        const startValues = {};
        const endValues = {};
        
        // Extract current and target values
        Object.keys(properties).forEach(prop => {
            if (prop === 'onComplete') return;
            
            const currentValue = this.getComputedValue(el, prop);
            startValues[prop] = currentValue;
            endValues[prop] = properties[prop];
        });
        
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeProgress = this.easeInOutCubic(progress);
            
            Object.keys(endValues).forEach(prop => {
                const startValue = startValues[prop];
                const endValue = endValues[prop];
                const currentValue = startValue + (endValue - startValue) * easeProgress;
                
                this.setComputedValue(el, prop, currentValue);
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (properties.onComplete) {
                properties.onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    static from(element, duration, properties) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        // Set initial values
        Object.keys(properties).forEach(prop => {
            if (prop !== 'onComplete') {
                this.setComputedValue(el, prop, properties[prop]);
            }
        });
        
        // Animate to computed values
        const computedProps = {};
        Object.keys(properties).forEach(prop => {
            if (prop !== 'onComplete') {
                computedProps[prop] = this.getComputedValue(el, prop, true);
            }
        });
        
        this.to(el, duration, { ...computedProps, onComplete: properties.onComplete });
    }
    
    static stagger(elements, duration, properties, staggerDelay = 0.1) {
        const els = typeof elements === 'string' ? document.querySelectorAll(elements) : elements;
        
        els.forEach((el, index) => {
            setTimeout(() => {
                this.to(el, duration, properties);
            }, index * staggerDelay * 1000);
        });
    }
    
    static getComputedValue(element, property, original = false) {
        const style = window.getComputedStyle(element);
        
        switch (property) {
            case 'x':
            case 'translateX':
                return original ? 0 : this.parseTransform(style.transform, 'translateX');
            case 'y':
            case 'translateY':
                return original ? 0 : this.parseTransform(style.transform, 'translateY');
            case 'scale':
                return original ? 1 : this.parseTransform(style.transform, 'scale');
            case 'rotate':
                return original ? 0 : this.parseTransform(style.transform, 'rotate');
            case 'opacity':
                return original ? 1 : parseFloat(style.opacity);
            default:
                return original ? 0 : parseFloat(style[property]) || 0;
        }
    }
    
    static setComputedValue(element, property, value) {
        switch (property) {
            case 'x':
            case 'translateX':
                this.setTransform(element, 'translateX', value);
                break;
            case 'y':
            case 'translateY':
                this.setTransform(element, 'translateY', value);
                break;
            case 'scale':
                this.setTransform(element, 'scale', value);
                break;
            case 'rotate':
                this.setTransform(element, 'rotate', value);
                break;
            default:
                element.style[property] = value + (typeof value === 'number' ? 'px' : '');
        }
    }
    
    static parseTransform(transform, type) {
        if (!transform || transform === 'none') return 0;
        
        const regex = new RegExp(`${type}\\(([^)]+)\\)`);
        const match = transform.match(regex);
        return match ? parseFloat(match[1]) : 0;
    }
    
    static setTransform(element, type, value) {
        const currentTransform = element.style.transform || '';
        const regex = new RegExp(`${type}\\([^)]*\\)`, 'g');
        const newTransform = currentTransform.replace(regex, '') + ` ${type}(${value}px)`;
        element.style.transform = newTransform.trim();
    }
    
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

// 3D Transform utilities
class Transform3D {
    static rotateX(element, angle) {
        element.style.transform = `perspective(1000px) rotateX(${angle}deg)`;
    }
    
    static rotateY(element, angle) {
        element.style.transform = `perspective(1000px) rotateY(${angle}deg)`;
    }
    
    static rotateZ(element, angle) {
        element.style.transform = `perspective(1000px) rotateZ(${angle}deg)`;
    }
    
    static translateZ(element, distance) {
        element.style.transform = `perspective(1000px) translateZ(${distance}px)`;
    }
    
    static scale3D(element, x, y, z) {
        element.style.transform = `perspective(1000px) scale3d(${x}, ${y}, ${z})`;
    }
    
    static complex(element, transforms) {
        const transformString = `perspective(1000px) ${transforms.join(' ')}`;
        element.style.transform = transformString;
    }
}

// Mouse tracking for 3D effects
class MouseTracker {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
        });
        
        this.animate();
    }
    
    animate() {
        this.mouseX += (this.targetX - this.mouseX) * 0.1;
        this.mouseY += (this.targetY - this.mouseY) * 0.1;
        
        // Update elements that follow mouse
        this.updateMouseFollowers();
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateMouseFollowers() {
        const followers = document.querySelectorAll('[data-mouse-follow]');
        
        followers.forEach(element => {
            const intensity = parseFloat(element.dataset.mouseFollow) || 0.1;
            const x = (this.mouseX - window.innerWidth / 2) * intensity;
            const y = (this.mouseY - window.innerHeight / 2) * intensity;
            
            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
}

// Initialize animation system
const animationController = new AnimationController();
const mouseTracker = new MouseTracker();

// Export for global use
window.GSAPLite = GSAPLite;
window.Transform3D = Transform3D;
window.animationController = animationController;

// Auto-initialize animations
document.addEventListener('DOMContentLoaded', function() {
    // Animate hero section
    GSAPLite.from('.writing p', 1000, { opacity: 0, y: 30 });
    GSAPLite.from('.writing h1', 1200, { opacity: 0, y: 50, scale: 0.8, delay: 200 });
    GSAPLite.from('.writing h2', 1000, { opacity: 0, x: -50, delay: 400 });
    GSAPLite.from('.btn-warning', 800, { opacity: 0, scale: 0.5, delay: 600 });
    
    // Stagger animate material cards
    GSAPLite.stagger('.material-card', 600, { 
        opacity: 0, 
        y: 50, 
        scale: 0.8,
        onComplete: function() {
            this.style.transform = '';
        }
    }, 100);
});
