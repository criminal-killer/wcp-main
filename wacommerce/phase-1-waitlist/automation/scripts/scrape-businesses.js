const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STORE_FILE = path.join(__dirname, 'scraped-businesses.json');

const LOCATIONS = [
    { city: 'Nairobi', country: 'Kenya' }, { city: 'Lagos', country: 'Nigeria' }, { city: 'Accra', country: 'Ghana' }, { city: 'Johannesburg', country: 'South Africa' },
    { city: 'Dar es Salaam', country: 'Tanzania' }, { city: 'Kampala', country: 'Uganda' }, { city: 'Cairo', country: 'Egypt' }, { city: 'Addis Ababa', country: 'Ethiopia' },
    { city: 'Casablanca', country: 'Morocco' }, { city: 'Algiers', country: 'Algeria' }, { city: 'Luanda', country: 'Angola' }, { city: 'Abidjan', country: 'Ivory Coast' },
    { city: 'Dakar', country: 'Senegal' }, { city: 'Kigali', country: 'Rwanda' }, { city: 'New York', country: 'USA' }, { city: 'London', country: 'UK' },
    { city: 'Toronto', country: 'Canada' }, { city: 'Sydney', country: 'Australia' }, { city: 'Berlin', country: 'Germany' }, { city: 'Paris', country: 'France' },
    { city: 'Dubai', country: 'UAE' }, { city: 'Mumbai', country: 'India' }, { city: 'Tokyo', country: 'Japan' }, { city: 'Sao Paulo', country: 'Brazil' },
    { city: 'Mexico City', country: 'Mexico' }, { city: 'Singapore', country: 'Singapore' }, { city: 'Istanbul', country: 'Turkey' }, { city: 'Hong Kong', country: 'China' }
];

const selected = process.env.CITY_NAME 
    ? { city: process.env.CITY_NAME, country: '' } 
    : LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

const CITY = selected.city;
const COUNTRY = selected.country;

async function scrapeBusinesses() {
    console.log(`--- Scraping Businesses in ${CITY} ---`);
    
    if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, '[]');
    const businesses = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));

    // Overpass API Query
    const query = `
        [out:json][timeout:60];
        area["name"="${CITY}"]->.a;
        (
          node["shop"](area.a);
          node["amenity"="restaurant"](area.a);
          node["amenity"="cafe"](area.a);
          node["craft"](area.a);
        );
        out body;
    `;

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', query);
        const elements = response.data.elements;
        
        let newCount = 0;
        elements.forEach(el => {
            if (el.tags && el.tags.name) {
                const id = `osm-${el.id}`;
                if (!businesses.find(b => b.id === id)) {
                    businesses.push({
                        id: id,
                        name: el.tags.name,
                        type: el.tags.shop || el.tags.amenity || el.tags.craft || 'business',
                        phone: el.tags['phone'] || el.tags['contact:phone'] || null,
                        website: el.tags['website'] || null,
                        city: CITY,
                        emailed: false,
                        scrape_date: new Date().toISOString()
                    });
                    newCount++;
                }
            }
        });

        fs.writeFileSync(STORE_FILE, JSON.stringify(businesses, null, 2));
        console.log(`✅ Found ${newCount} new businesses. Total: ${businesses.length}`);

    } catch (err) {
        console.error('❌ Scraping error:', err.message);
    }
}

scrapeBusinesses();
