import { useEffect, useState } from "react";

interface Testimonial {
  id: number;
  name: string;
  image: string;
  text: string;
}

// --- 9 Crypto Investment Testimonials ---
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Alice",
    image: "/images/testimonials/alice.jpg",
    text: "AITradePro has completely changed the way I invest in crypto. I now feel confident making informed decisions and watching my portfolio grow daily."
  },
  {
    id: 2,
    name: "Bob",
    image: "/images/testimonials/bob.jpg",
    text: "With the live charts and expert insights, I’ve been able to diversify into forex and metals seamlessly. Highly recommended for anyone serious about investing!"
  },
  {
    id: 3,
    name: "Charlie",
    image: "/images/testimonials/charlie.jpg",
    text: "The platform’s automated signals helped me catch profitable crypto trades I would have missed otherwise. A game-changer for passive investors!"
  },
  {
    id: 4,
    name: "Diana",
    image: "/images/testimonials/diana.jpg",
    text: "AITradePro makes trading indices easy and understandable, even for beginners. I’ve seen steady growth thanks to their resources and charts."
  },
  {
    id: 5,
    name: "Eve",
    image: "/images/testimonials/eve.jpg",
    text: "I love the clear interface and detailed analytics. I can track profits across crypto, metals, and forex without any confusion."
  },
  {
    id: 6,
    name: "Frank",
    image: "/images/testimonials/frank.jpg",
    text: "The support team is always ready to assist, and the live insights have helped me make smarter investments in crypto markets."
  },
  {
    id: 7,
    name: "Grace",
    image: "/images/testimonials/grace.jpg",
    text: "Diversifying into multiple assets has never been easier. AITradePro gives me confidence to manage my wealth efficiently."
  },
  {
    id: 8,
    name: "Hank",
    image: "/images/testimonials/hank.jpg",
    text: "From beginner to pro-level trading tools, this platform offers everything. My crypto and forex investments have seen consistent growth."
  },
  {
    id: 9,
    name: "Ivy",
    image: "/images/testimonials/ivy.jpg",
    text: "The rotating testimonial view keeps things fresh and engaging. I enjoy seeing other users’ success and staying motivated to trade smartly."
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate 3 testimonials at a time every 5 seconds
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

  const currentTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ];

  return (
    <div
      className={`flex justify-center gap-6 transition-opacity duration-500 ${
        fade ? "opacity-100" : "opacity-0"
      } flex-wrap md:flex-nowrap overflow-x-auto md:overflow-x-visible scrollbar-hide`}
    >
      {currentTestimonials.map((t) => (
        <div
          key={t.id}
          className="flex flex-col items-center bg-[#13151f] shadow-lg rounded-xl p-6 w-64 flex-shrink-0"
        >
          <img
            src={t.image}
            alt={t.name}
            className="w-16 h-16 rounded-full object-cover mb-3"
          />
          <p className="text-gray-300 italic text-sm mb-2 text-center">
            &quot;{t.text}&quot;
          </p>
          <p className="text-white font-semibold">{t.name}</p>
        </div>
      ))}
    </div>
  );
}
