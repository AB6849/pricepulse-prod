import { useEffect } from 'react';

export default function Particles() {
  useEffect(() => {
    const particles = document.getElementById('particles');
    if (!particles) return;

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particles.appendChild(particle);
    }

    return () => {
      particles.innerHTML = '';
    };
  }, []);

  return <div className="particles" id="particles"></div>;
}



