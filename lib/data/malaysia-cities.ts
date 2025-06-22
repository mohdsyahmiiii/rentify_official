export const malaysianStates = [
  {
    name: "Johor",
    cities: [
      "Johor Bahru",
      "Batu Pahat",
      "Muar",
      "Kluang",
      "Segamat",
      "Pontian",
      "Kulai",
      "Skudai",
      "Iskandar Puteri",
      "Pasir Gudang",
    ],
  },
  {
    name: "Kedah",
    cities: ["Alor Setar", "Sungai Petani", "Kulim", "Jitra", "Baling", "Pendang", "Langkawi", "Kuala Kedah"],
  },
  {
    name: "Kelantan",
    cities: ["Kota Bharu", "Kuala Krai", "Tanah Merah", "Machang", "Pasir Mas", "Gua Musang", "Tumpat"],
  },
  {
    name: "Kuala Lumpur",
    cities: [
      "Kuala Lumpur",
      "Cheras",
      "Kepong",
      "Setapak",
      "Wangsa Maju",
      "Titiwangsa",
      "Seputeh",
      "Lembah Pantai",
      "Segambut",
      "Bukit Bintang",
    ],
  },
  {
    name: "Labuan",
    cities: ["Victoria"],
  },
  {
    name: "Malacca",
    cities: ["Malacca City", "Alor Gajah", "Jasin", "Merlimau", "Masjid Tanah"],
  },
  {
    name: "Negeri Sembilan",
    cities: ["Seremban", "Port Dickson", "Nilai", "Bahau", "Tampin", "Kuala Pilah", "Rembau"],
  },
  {
    name: "Pahang",
    cities: [
      "Kuantan",
      "Temerloh",
      "Bentong",
      "Raub",
      "Jerantut",
      "Pekan",
      "Kuala Lipis",
      "Cameron Highlands",
      "Genting Highlands",
    ],
  },
  {
    name: "Penang",
    cities: [
      "George Town",
      "Butterworth",
      "Bukit Mertajam",
      "Nibong Tebal",
      "Permatang Pauh",
      "Tanjung Tokong",
      "Bayan Lepas",
      "Jelutong",
    ],
  },
  {
    name: "Perak",
    cities: [
      "Ipoh",
      "Taiping",
      "Teluk Intan",
      "Sitiawan",
      "Kuala Kangsar",
      "Lumut",
      "Parit Buntar",
      "Batu Gajah",
      "Kampar",
      "Tanjung Malim",
    ],
  },
  {
    name: "Perlis",
    cities: ["Kangar", "Arau", "Padang Besar"],
  },
  {
    name: "Putrajaya",
    cities: ["Putrajaya"],
  },
  {
    name: "Sabah",
    cities: [
      "Kota Kinabalu",
      "Sandakan",
      "Tawau",
      "Lahad Datu",
      "Keningau",
      "Kota Belud",
      "Kudat",
      "Semporna",
      "Beaufort",
      "Papar",
    ],
  },
  {
    name: "Sarawak",
    cities: ["Kuching", "Miri", "Sibu", "Bintulu", "Limbang", "Sarikei", "Sri Aman", "Kapit", "Mukah", "Betong"],
  },
  {
    name: "Selangor",
    cities: [
      "Shah Alam",
      "Petaling Jaya",
      "Subang Jaya",
      "Klang",
      "Ampang",
      "Cheras",
      "Kajang",
      "Puchong",
      "Seri Kembangan",
      "Bangi",
      "Cyberjaya",
      "Sepang",
      "Rawang",
      "Selayang",
      "Gombak",
      "Hulu Selangor",
    ],
  },
  {
    name: "Terengganu",
    cities: ["Kuala Terengganu", "Kemaman", "Dungun", "Chukai", "Marang", "Besut"],
  },
]

// Flatten all cities for easy searching
export const allMalaysianCities = malaysianStates.flatMap((state) =>
  state.cities.map((city) => ({
    city,
    state: state.name,
    fullLocation: `${city}, ${state.name}`,
  })),
)

// Get cities by state
export const getCitiesByState = (stateName: string) => {
  const state = malaysianStates.find((s) => s.name === stateName)
  return state ? state.cities : []
}

// Search cities
export const searchCities = (query: string) => {
  if (!query) return []

  const lowercaseQuery = query.toLowerCase()
  return allMalaysianCities.filter(
    (location) =>
      location.city.toLowerCase().includes(lowercaseQuery) || location.state.toLowerCase().includes(lowercaseQuery),
  )
}
