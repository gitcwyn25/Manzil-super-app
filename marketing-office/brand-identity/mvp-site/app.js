const businesses = [
  {
    name: "Yunusobod Osh Markazi",
    category: "restaurant",
    categoryLabel: "Milliy taomlar",
    district: "Yunusobod tumani",
    rating: "4.8",
    reviews: "1,240",
    price: "55 000 - 120 000 UZS",
    status: "Ochiq",
    photoClass: "photo-plov",
  },
  {
    name: "Caravan Coffee",
    category: "cafe",
    categoryLabel: "Qahvaxona",
    district: "Mirobod tumani",
    rating: "4.7",
    reviews: "328",
    price: "30 000 - 90 000 UZS",
    status: "Wi-Fi bor",
    photoClass: "photo-coffee",
  },
  {
    name: "Chilonzor Somsa Saroyi",
    category: "restaurant",
    categoryLabel: "Somsa",
    district: "Chilonzor tumani",
    rating: "4.6",
    reviews: "850",
    price: "12 000 - 45 000 UZS",
    status: "Ochiq",
    photoClass: "photo-somsa",
  },
  {
    name: "Glow Beauty",
    category: "beauty",
    categoryLabel: "Go'zallik saloni",
    district: "Chilonzor tumani",
    rating: "4.7",
    reviews: "214",
    price: "80 000 - 350 000 UZS",
    status: "Bugun 20:00 gacha",
    photoClass: "photo-tea",
  },
  {
    name: "TechFix Xizmati",
    category: "repair",
    categoryLabel: "Telefon ta'mirlash",
    district: "Shayxontohur tumani",
    rating: "4.9",
    reviews: "56",
    price: "50 000 - 400 000 UZS",
    status: "Tezkor xizmat",
    photoClass: "photo-coffee",
  },
  {
    name: "Avto Usta 24",
    category: "auto",
    categoryLabel: "Avtoservis",
    district: "Sergeli tumani",
    rating: "4.5",
    reviews: "172",
    price: "100 000 UZS dan",
    status: "Navbat bor",
    photoClass: "photo-somsa",
  },
];

const grid = document.querySelector("#businessGrid");
const resultCount = document.querySelector("#resultCount");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const categoryButtons = document.querySelectorAll(".category-chip");
const reviewForm = document.querySelector("#reviewForm");
const reviewMessage = document.querySelector("#reviewMessage");
const claimForm = document.querySelector("#claimForm");
const claimMessage = document.querySelector("#claimMessage");

let activeCategory = "all";
let activeQuery = "";

function businessCardTemplate(business) {
  return `
    <article class="business-card">
      <div class="business-photo ${business.photoClass}">
        <span class="rating-badge">${business.rating} (${business.reviews})</span>
        <span class="status-chip">${business.status}</span>
      </div>
      <div class="business-body">
        <h3>${business.name}</h3>
        <p class="business-meta">${business.categoryLabel} · ${business.district}</p>
        <div class="business-footer">
          <strong>${business.price}</strong>
          <span>${business.reviews} sharh</span>
        </div>
      </div>
    </article>
  `;
}

function renderBusinesses() {
  const query = activeQuery.trim().toLowerCase();
  const filtered = businesses.filter((business) => {
    const matchesCategory =
      activeCategory === "all" || business.category === activeCategory;
    const haystack = `${business.name} ${business.categoryLabel} ${business.district}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });

  grid.innerHTML = filtered.map(businessCardTemplate).join("");
  resultCount.textContent = `${filtered.length} ta natija`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <article class="business-card">
        <div class="business-body">
          <h3>Natija topilmadi</h3>
          <p class="business-meta">Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring.</p>
        </div>
      </article>
    `;
  }
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.category;
    renderBusinesses();
  });
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  activeQuery = searchInput.value;
  renderBusinesses();
  document.querySelector("#discover").scrollIntoView({ behavior: "smooth" });
});

reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = document.querySelector("#reviewText").value.trim();

  if (text.length < 20) {
    reviewMessage.textContent = "Sharh kamida 20 ta belgidan iborat bo'lishi kerak.";
    reviewMessage.style.color = "#ba1a1a";
    return;
  }

  reviewMessage.textContent =
    "Rahmat. MVP demo holatida, backend ulanganda sharhingiz saqlanadi.";
  reviewMessage.style.color = "#005454";
  reviewForm.reset();
});

claimForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const businessName = document.querySelector("#claimName").value.trim();
  const phone = document.querySelector("#claimPhone").value.trim();

  if (!businessName || !phone) {
    claimMessage.textContent = "Biznes nomi va telefon raqamini kiriting.";
    return;
  }

  claimMessage.textContent =
    "So'rov qabul qilindi. Keyingi versiyada admin tasdiqlash oqimiga ulanadi.";
  claimForm.reset();
});

renderBusinesses();
