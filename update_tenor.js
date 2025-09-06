
// Helper script to update expression commands to use Tenor API
// Run this to see the pattern for updating other commands

const tenorApiKey = 'AIzaSyA3mHp0BiA_o4isPpXsc5ykRlHarIyQo8M';

// Example of how to construct Tenor API URLs for different commands
const commandSearchTerms = {
    slap: ['anime slap', 'slap face', 'cartoon slap', 'slap fight', 'face slap'],
    kiss: ['anime kiss', 'cute kiss', 'kiss love', 'romantic kiss', 'sweet kiss'],
    punch: ['anime punch', 'punch fight', 'action punch', 'fighting punch', 'cartoon punch'],
    bite: ['anime bite', 'cute bite', 'playful bite', 'nom nom', 'bite chomp'],
    jail: ['arrest jail', 'police arrest', 'going to jail', 'handcuffs arrest', 'cartoon jail'],
    kill: ['anime fight', 'dramatic death', 'cartoon knockout', 'game over', 'defeat'],
    spank: ['anime spank', 'playful spank', 'cartoon spank', 'funny spank', 'discipline']
};

// Function to get Tenor GIF URL
function getTenorUrl(searchTerm) {
    return `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${tenorApiKey}&limit=50&contentfilter=medium`;
}

// Example of parsing Tenor response
function parseResponse(data) {
    if (data.results && data.results.length > 0) {
        const randomGif = data.results[Math.floor(Math.random() * data.results.length)];
        return randomGif.media_formats.gif.url;
    }
    return null;
}

console.log('Use this pattern to update your other expression commands:');
console.log('1. Replace Giphy API URL with Tenor API URL');
console.log('2. Update response parsing from data.data to data.results');
console.log('3. Update GIF URL from randomGif.images.original.url to randomGif.media_formats.gif.url');
console.log('4. Update footer text from "Powered by Giphy" to "Powered by Tenor"');
