import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FadeContent = ({
    children,
    className = '',
    delay = 0,
    blur = false,
    ...props
}) => {
    const ref = useRef();

    useEffect(() => {
        const el = ref.current;

        const animation = gsap.fromTo(
            el,
            {
                opacity: 0,
            },
            {
                opacity: 1,
                delay: delay / 1000,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    scroller: document.querySelector('[data-scroll]'),
                    start: 'top 85%',
                    once: true,
                },
            }
        );

        return () => {
            animation.scrollTrigger?.kill();
            animation.kill();
        };
    }, [delay]);

    return (
        <div
            ref={ref}
            style={{ willChange: 'opacity' }}
            className={`${className} ${blur ? 'backdrop-blur-sm' : ''}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default FadeContent;
