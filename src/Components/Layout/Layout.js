import React from 'react';
import NavigationButton from '../../Containers/NavigationButton/NavigationButton';
import Footer from '../../Components/Footer/Footer';
import './Layout';

const layout = props => {
    return (
        <>
            <NavigationButton />
            <main>
                {props.children}
                <Footer />
            </main>
        </>
    )
};

export default layout;