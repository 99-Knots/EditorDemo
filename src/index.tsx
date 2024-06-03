import React from 'react';
import ReactDOM from 'react-dom';
import {setupEngine} from './components/main'

setupEngine();
ReactDOM.render(<h1>React Test</h1>, document.getElementById('react-root'));