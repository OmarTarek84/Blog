import React from 'react';
import NavigationButton from '../../../navigation/pages/NavigationButton/NavigationButton';
import Footer from '../Footer/Footer';
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