import axios from "axios";

const ticketmaster = axios.create({
  baseURL: "https://app.ticketmaster.com/discovery/v2",
  params: {
    apikey: process.env.TICKETMASTER_API_KEY,
  },
});

export default ticketmaster;