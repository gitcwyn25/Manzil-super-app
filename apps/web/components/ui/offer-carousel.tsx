import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Offer {
  id: string | number;
  imageSrc: string;
  imageAlt: string;
  tag: string;
  title: string;
  description: string;
  brandLogoSrc: string;
  brandName: string;
  promoCode?: string;
  href: string;
}

interface OfferCardProps {
  offer: Offer;
}

const OfferCard = React.forwardRef<HTMLAnchorElement, OfferCardProps>(({ offer }, ref) => (
  <motion.a
    ref={ref}
    href={offer.href}
    className="offer-carousel__card"
    whileHover={{ y: -8 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    style={{ perspective: "1000px" }}
  >
    <img
      src={offer.imageSrc}
      alt={offer.imageAlt}
      className="offer-carousel__image"
      loading="lazy"
    />
    <div className="offer-carousel__body">
      <div className="offer-carousel__content">
        <div className="offer-carousel__tag">
          <Tag aria-hidden="true" className="offer-carousel__tag-icon" size={16} />
          <span>{offer.tag}</span>
        </div>
        <h3 className="offer-carousel__title">{offer.title}</h3>
        <p className="offer-carousel__description">{offer.description}</p>
      </div>

      <div className="offer-carousel__footer">
        <div className="offer-carousel__brand">
          <img
            src={offer.brandLogoSrc}
            alt=""
            aria-hidden="true"
            className="offer-carousel__brand-logo"
            loading="lazy"
          />
          <div>
            <p className="offer-carousel__brand-name">{offer.brandName}</p>
            {offer.promoCode ? <p className="offer-carousel__promo-code">{offer.promoCode}</p> : null}
          </div>
        </div>
        <span className="offer-carousel__arrow" aria-hidden="true">
          <ArrowRight size={16} />
        </span>
      </div>
    </div>
  </motion.a>
));
OfferCard.displayName = "OfferCard";

export interface OfferCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  offers: Offer[];
}

const OfferCarousel = React.forwardRef<HTMLDivElement, OfferCarouselProps>(
  ({ offers, className, ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      const container = scrollContainerRef.current;
      if (!container) return;

      container.scrollBy({
        left: direction === "left" ? -container.clientWidth * 0.8 : container.clientWidth * 0.8,
        behavior: "smooth"
      });
    };

    return (
      <div ref={ref} className={cn("offer-carousel", className)} {...props}>
        <button
          aria-label="Scroll offers left"
          className="offer-carousel__control offer-carousel__control--left"
          onClick={() => scroll("left")}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={22} />
        </button>

        <div ref={scrollContainerRef} className="offer-carousel__viewport">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        <button
          aria-label="Scroll offers right"
          className="offer-carousel__control offer-carousel__control--right"
          onClick={() => scroll("right")}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={22} />
        </button>
      </div>
    );
  }
);
OfferCarousel.displayName = "OfferCarousel";

export { OfferCarousel, OfferCard };
