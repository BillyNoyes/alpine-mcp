import Alpine from 'alpinejs';
import {createInstallTabs, createSearchDemo} from './components';
import './style.css';

Alpine.data('searchDemo', createSearchDemo);
Alpine.data('installTabs', createInstallTabs);
Alpine.start();
