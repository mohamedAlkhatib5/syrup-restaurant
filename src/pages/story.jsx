import { Container, Row, Col } from 'react-bootstrap'
import { FaHeart, FaMedal, FaUsers } from 'react-icons/fa'
import '../pages.css/story.css';
import storysection from "../assets/images/storysection.jpg";
// title
import { useEffect } from 'react'
import { useCart } from '../context/CartContext'


function Story() {


    // title
    const { setPageTitle } = useCart()
    useEffect(() => {
        setPageTitle('Story')
    }, [setPageTitle])
    // ************
    const values = [
        [<FaHeart />, 'Cooked with care', 'Thoughtful preparation from the first ingredient to the final garnish.'],
        [<FaMedal />, 'Quality without compromise', 'Trusted suppliers, premium produce and precise kitchen standards.'],
        [<FaUsers />, 'Hospitality first', 'A relaxed table where friends and families feel at home.']]
    return (<>
        <section className="page-header">
            <div className="page-header-overlay" />
            <div className="container position-relative">
                <h1>Our Story</h1>
                <p>A passion for honest food, thoughtful craft and memorable hospitality.</p>
            </div>
        </section>
        <section className="section-padding">
            <Container>
                <Row className="align-items-center g-5">
                    <Col lg={6} data-aos="fade-right">
                        <img src={storysection} className="rounded-image" alt="Elegant restaurant table" />
                    </Col>
                    <Col lg={6} data-aos="fade-left">
                        <span className="eyebrow dark">Since 2012</span>
                        <h2 className="display-title">Every dish starts with respect for the ingredient.</h2>
                        <p>We created Syrup as a modern neighbourhood restaurant—refined enough for celebrations, relaxed enough for any day of the week.</p><p>Our kitchen blends open-fire cooking with Mediterranean and Italian inspiration. The result is food that feels familiar, but always has something new to discover.</p></Col></Row></Container></section>
        <section className="section-padding soft-section">
            <Container>

                <div className="section-title" data-aos="fade-up"><span>What guides us</span><h2>The values behind every service</h2></div>
                <Row className="g-4">{values.map(([icon, title, text]) => <Col md={4} key={title}>
                    <div className="value-card" data-aos="fade-up">
                        <div>{icon}</div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                    </div></Col>)}
                </Row></Container>
        </section>
    </>)
}
export default Story
