import React, { useState } from "react";
import { Search } from "@mui/icons-material";

const YouTubeSearch = () => {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([
    {
      title: "Improve Your Turns - Dance Tutorial",
      url: "https://www.youtube.com/watch?v=NnWVlVfrBeY",
      thumbnail: "https://img.youtube.com/vi/NnWVlVfrBeY/0.jpg",
    },
    {
      title: "How to Balance Better in Turns",
      url: "https://www.youtube.com/watch?v=MAnIsPQWWpw",
      thumbnail: "https://img.youtube.com/vi/MAnIsPQWWpw/0.jpg",
    },
    {
      title: "Pirouette Tips for Dancers",
      url: "https://www.youtube.com/watch?v=5jULEGAjj0w",
      thumbnail: "https://img.youtube.com/vi/5jULEGAjj0w/0.jpg",
    },
  ]);

  const handleSearch = () => {
    if (query.trim() === "") return;
    
    // Simulating a filtered YouTube search (mock data)
    const filteredVideos = videos.filter((video) =>
      video.title.toLowerCase().includes(query.toLowerCase())
    );
    
    setVideos(filteredVideos.length ? filteredVideos : videos);
  };

  return (
    <div className="bg-white shadow-md p-6 rounded-lg">
      {/* Search Bar */}
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search dance techniques..."
          className="flex-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          className="ml-3 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 flex items-center"
          onClick={handleSearch}
        >
          <Search className="mr-2" /> Search
        </button>
      </div>

      {/* Video Results */}
      <h2 className="text-lg font-semibold mb-3 text-gray-700">Popular Dance Tutorials</h2>
      <div className="space-y-4">
        {videos.map((video, index) => (
          <a
            key={index}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 border rounded-lg hover:bg-gray-100 transition"
          >
            <img src={video.thumbnail} alt={video.title} className="w-20 h-12 rounded-md mr-4" />
            <span className="text-gray-800 font-medium">{video.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default YouTubeSearch;

