import { Routes, Route } from "react-router-dom";
import { useEffect } from 'react'
import Home from "./pages/Home";
import About from "./pages/story";
import Menu from "./pages/Menu";
import Contact from "./pages/Contact";
import Order from "./pages/Order";
import NotFound from "./pages/NotFound";
import Header from "./components/Navbar";
import Footer from './components/Footer';


// مكتبة الحركات 
import AOS from 'aos';
import 'aos/dist/aos.css';


function App() {
  // تشغيل مكتبة الحركات عند تحميل التطبيق لأول مرة.
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      offset: 80,
    })
  }, [])
  return (
    <>
      <Header />
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/Story" element={<About />} />
        <Route path="/Menu" element={<Menu />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Order" element={<Order />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
      <Footer />
    </>

  );
}

export default App;