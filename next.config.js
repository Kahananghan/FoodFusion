const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
  images: {
    remotePatterns: [
      // Previously allowed domains (converted to remotePatterns)
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'plus.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'https', hostname: 'b.zmtcdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'dreamfestiva.com', pathname: '/**' },
      // iStock external images
      { protocol: 'https', hostname: 'media.istockphoto.com', pathname: '/**' },
      // Google user content (keep existing explicit entries as well)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn1.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn2.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 'encrypted-tbn3.gstatic.com', pathname: '/**' },
      // Additional explicit patterns already present
      // Allow any size googleusercontent (covers future lhX hosts)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        pathname: '/**'
      }
    ]
  },
}

module.exports = nextConfig