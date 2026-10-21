// Business facts used across every page, structured data and llms.txt.
// Keep these in one place so the phone number or hours only ever change here.
export const business = {
  name: "Pixie Dust Floral Design",
  owner: "Tiffany",
  tagline: "Creativity is at our core.",
  phone: "(336) 310-9001",
  phoneHref: "tel:+13363109001",
  phoneE164: "+1-336-310-9001",
  street: "6010 Habersham Dr",
  city: "Kernersville",
  region: "NC",
  postalCode: "27284",
  geo: { lat: 36.1630955, lng: -80.1036513 },
  instagram: "https://www.instagram.com/pixiedustflorals/",
  instagramHandle: "@pixiedustflorals",
  googleReviews: "https://maps.google.com/?cid=11610445823256602062",
  rating: { value: "4.8", count: 47, fiveStar: 45 },
  hours: [
    { label: "Monday – Friday", value: "9am – 2pm", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "14:00" },
    { label: "Saturday", value: "10am – 12pm", days: ["Saturday"], opens: "10:00", closes: "12:00" },
    { label: "Sunday", value: "Closed", days: [] },
  ],
  specialties: ["Bridal Bouquets", "Ranunculus", "Coral Charm Peonies", "Astilbe", "Succulents", "Corsages", "Centerpieces", "Installations"],
};

export const fullAddress = `${business.street}, ${business.city}, ${business.region} ${business.postalCode}`;
export const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=6010+Habersham+Dr+Kernersville+NC+27284";
