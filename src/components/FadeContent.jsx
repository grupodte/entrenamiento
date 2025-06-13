import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FadeContent = ({
    children,
    className = '',
    delay = 0,
    blur = false,
    initialOpacity = 0,
    ...props
}) => {
    const ref = useRef();

    useEffect(() => {
        const el = ref.current;

        const animation = gsap.fromTo(
            el,
            {
                opacity: 0,
                y: 30,
            },
            {
                opacity: 1,
                y: 0,
                delay: delay / 1000,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    scroller: document.querySelector('[data-scroll]'),
                    start: 'top 85%',
                    once: true, // 👈 solo una vez
                },
            }
        );

        return () => {
            animation.scrollTrigger?.kill();
            animation.kill();
        };
    }, [delay]);
      
      
    const safeProps = { ...props };
    delete safeProps.blur;
    delete safeProps.delay;
    delete safeProps.stagger;
    delete safeProps.initialOpacity;

    return (
        <div
            ref={ref}
            style={{ willChange: 'opacity, transform' }} // ✅ mejora rendimiento de animación
            className={`${className} ${blur ? 'backdrop-blur-sm' : ''}`}
            {...safeProps}
        >
            {children}
        </div>
    );
};

export default FadeContent;
