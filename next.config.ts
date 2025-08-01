/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		domains: ["res.cloudinary.com", "www.finiteloop.co.in"],
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "30mb",
		},
	},
};

export default nextConfig;
