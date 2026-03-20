import db from "../db.js";
import ticketmaster from "../utils/ticketMaster.js";

const RADIUS = 100;

function buildLocationParams(lat, lng, city) {
  if (city) return { city };
  return { latlong: `${lat},${lng}`, radius: RADIUS, unit: "miles" };
}

function mapEvent(event, artist, followed) {
  return {
    id: event.id,
    name: event.name,
    artist,
    date: event.dates?.start?.localDate,
    time: event.dates?.start?.localTime,
    venue: event._embedded?.venues?.[0]?.name,
    city: event._embedded?.venues?.[0]?.city?.name,
    state: event._embedded?.venues?.[0]?.state?.stateCode,
    ticketUrl: event.url,
    imageUrl: event.images?.[0]?.url,
    followed,
  };
}

async function getNearbyShows(req, res) {
  const { lat, lng, city, genreId } = req.query;

  if (!city && (!lat || !lng)) {
    return res.status(400).json({ error: "Provide either city or lat+lng" });
  }

  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const locationParams = buildLocationParams(lat, lng, city);
  const extraParams = genreId ? { genreId } : {};

  try {
    const { rows: follows } = await db.query(
      "SELECT artist_name FROM follows WHERE user_id = $1",
      [req.session.userId]
    );

    const followedNames = new Set(
      follows.map((f) => f.artist_name.toLowerCase())
    );

    const seenIds = new Set();
    const followedShows = [];
    const discoveryShows = [];

    // Followed-artist shows: one keyword search per artist
    for (const { artist_name } of follows) {
      try {
        const { data } = await ticketmaster.get("/events.json", {
          params: {
            keyword: artist_name,
            sort: "date,asc",
            size: 5,
            ...locationParams,
            ...extraParams,
          },
        });

        for (const event of data._embedded?.events ?? []) {
          if (seenIds.has(event.id)) continue;
          seenIds.add(event.id);
          followedShows.push(mapEvent(event, artist_name, true));
        }
      } catch (err) {
        console.error(`Ticketmaster error for ${artist_name}:`, err.message);
      }
    }

    // Discovery shows: broader music search in same location/genre
    try {
      const { data } = await ticketmaster.get("/events.json", {
        params: {
          classificationName: "music",
          sort: "date,asc",
          size: 20,
          ...locationParams,
          ...extraParams,
        },
      });

      for (const event of data._embedded?.events ?? []) {
        if (seenIds.has(event.id)) continue;
        seenIds.add(event.id);

        const artistName = event._embedded?.attractions?.[0]?.name ?? null;
        const isFollowed =
          artistName && followedNames.has(artistName.toLowerCase());

        if (isFollowed) {
          followedShows.push(mapEvent(event, artistName, true));
        } else {
          discoveryShows.push(mapEvent(event, artistName, false));
        }
      }
    } catch (err) {
      console.error("Discovery shows error:", err.message);
    }

    followedShows.sort((a, b) => new Date(a.date) - new Date(b.date));
    discoveryShows.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.json([...followedShows, ...discoveryShows]);
  } catch (err) {
    console.error("Get shows error:", err.message);
    return res.status(500).json({ error: "Failed to fetch shows" });
  }
}

export { getNearbyShows };
