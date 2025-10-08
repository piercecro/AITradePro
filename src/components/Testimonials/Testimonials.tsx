import { useEffect, useState } from "react";

interface Testimonial {
  id: number;
  name: string;
  image: string;
  text: string;
}

// 9 Crypto Investment-focused Testimonials
const testimonials: Testimonial[] = [
  { id: 1, name: "Alice", image: "/images/testimonials/alice.jpg", text: "Thanks to AITradePro, I have learned to invest in crypto confidently. My portfolio has grown steadily over the last six months!" },
  { id: 2, name: "Bob", image: "/images/testimonials/bob.jpg", text: "The forex and metals tools are incredible. I never thought I could manage multiple markets at once, but now I do!" },
  { id: 3, name: "Charlie", image: "/images/testimonials/charlie.jpg", text: "AITradePro’s dashboard makes trading simple. The insights and analytics help me make smart decisions every day." },
  { id: 4, name: "Diana", image: "/images/testimonials/diana.jpg", text: "I was a beginner in crypto, but the tutorials and platform tools helped me start investing confidently. I’m seeing real results!" },
  { id: 5, name: "Eve", image: "/images/testimonials/eve.jpg", text: "From indices to cryptocurrencies, AITradePro has helped me diversify my investments and grow my wealth securely." },
  { id: 6, name: "Frank", image: "/images/testimonials/frank.jpg", text: "The risk management features are top-notch. I feel in control of my investments and can plan my trades wisely." },
  { id: 7, name: "Grace", image: "/images/testimonials/grace.jpg", text: "This platform transformed how I approach investing. Crypto, forex, metals — all in one place with real-time insights." },
  { id: 8, name: "Hank", image: "/images/testimonials/hank.jpg", text: "I’ve recommended AITradePro to all my friends. The ease of use and detailed analytics make trading enjoyable and profitable." },
  { id: 9, name: "Ivy", image: "/images/testimonials/ivy.jpg", text: "AITradePro is a game-changer. I now feel confident managing a diversified investment portfolio across multiple markets." },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Automatically rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // fade out
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 3) % testimonials.length);
        setFade(true); // fade in
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Get current testimonials depending on screen size
  const getVisibleTestimonials = () => {
    const width = window.innerWidth;
    const count = width < 640 ? 1 : width < 1024 ? 2 : 3; // 1 mobile, 2 tablet, 3 desktop
    return Array.from({ length: count }, (_, i) => testimonials[(currentIndex + i) % testimonials.length]);
  };

  const [visibleTestimonials, setVisibleTestimonials] = useState(getVisibleTestimonials());

  useEffect(() => {
    const handleResize = () => {
      setVisibleTestimonials(getVisibleTestimonials());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentIndex]);

  return (
    <div className={`flex flex-col sm:flex-row justify-center gap-6 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'} mt-12 mb-12`}>
      {visibleTestimonials.map((t) => (
        <div
          key={t.id}
          className="flex flex-col items-center bg-[#13151f] shadow-lg rounded-xl p-6 w-64 sm:w-80"
        >
          <img
            src={t.image}
            alt={t.name}
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
          <p className="text-gray-300 italic text-sm mb-2 text-center">{t.text}</p>
          <p className="text-white font-semibold">{t.name}</p>
        </div>
      ))}
    </div>
  );
}
