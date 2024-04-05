//import { Inter } from "next/font/google";
import "@/styles/globals.css";

//const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Create Next App",
    description: "Generated by create next app",
};

const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <body>
                { children }
            </body>
        </html>
    );
};

export default RootLayout;
