import { useEffect, useState } from 'react';

interface Testimonial {
  id: number;
  name: string;
  image: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Alice',
    image: '/images/testimonials/alice.jpg',
    text: 'AITradePro has completely changed the way I invest in crypto. I now feel confident making informed decisions and watching my portfolio grow daily.',
  },
  {
    id: 2,
    name: 'Bob',
    image: '/images/testimonials/bob.jpg',
    text: 'With the live charts and expert insights, I’ve been able to diversify into forex and metals seamlessly. Highly recommended for anyone serious about investing!',
  },
  {
    id: 3,
    name: 'Charlie',
    image: '/images/testimonials/charlie.jpg',
    text: 'The platform’s automated signals helped me catch profitable crypto trades I would have missed otherwise. A game-changer for passive investors!',
  },
  {
    id: 4,
    name: 'Diana',
    image: '/images/testimonials/diana.jpg',
    text: 'AITradePro makes trading indices easy and understandable, even for beginners. I’ve seen steady growth thanks to their resources and charts.',
  },
  {
    id: 5,
    name: 'Eve',
    image: '/images/testimonials/eve.jpg',
    text: 'I love the clear interface and detailed analytics. I can track profits across crypto, metals, and forex without any confusion.',
  },
  {
    id: 6,
    name: 'Frank',
    image: '/images/testimonials/frank.jpg',
    text: 'The support team is always ready to assist, and the live insights have helped me make smarter investments in crypto markets.',
  },
  {
    id: 7,
    name: 'Grace',
    image: '/images/testimonials/grace.jpg',
    text: 'Diversifying into multiple assets has never been easier. AITradePro gives me confidence to manage my wealth efficiently.',
  },
  {
    id: 8,
    name: 'Hank',
    image: '/images/testimonials/hank.jpg',
    text: 'From beginner to pro-level trading tools, this platform offers everything. My crypto and forex investments have seen consistent growth.',
  },
  {
    id: 9,
    name: 'Ivy',
    image: '/images/testimonials/ivy.jpg',
    text: 'I enjoy seeing other users’ success and staying motivated to trade smartly.',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Keep each set visible for 15 seconds, with a brief fade between sets.
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      const transition = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 3) % testimonials.length);
        setFade(true);
      }, 500);
      return () => clearTimeout(transition);
    }, 15000);

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
        fade ? 'opacity-100' : 'opacity-0'
      } flex-wrap overflow-x-auto scrollbar-hide md:flex-nowrap md:overflow-x-visible`}
    >
      {currentTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="flex w-64 flex-shrink-0 flex-col items-center rounded-xl border border-[#dfe7f0] bg-white p-6 text-center shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        >
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="mb-3 h-16 w-16 rounded-full object-cover"
          />
          <p className="mb-2 text-sm italic text-slate-600">&quot;{testimonial.text}&quot;</p>
          <p className="font-semibold text-slate-800">{testimonial.name}</p>
        </div>
      ))}
    </div>
  );
}
