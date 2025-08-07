import { gsap } from 'gsap';

const scrollToElement = (element) => {
    gsap.to(window, {
        duration: 0.8,
        scrollTo: {
            y: element,
            offsetY: window.innerHeight / 2
        },
        ease: "power2.out"
    });
};
