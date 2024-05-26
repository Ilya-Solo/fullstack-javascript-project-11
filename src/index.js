import  './styles.scss';
import  'bootstrap';
const yup = require('yup');

const form = document.querySelector('.rss-form')
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const urlSchema = yup.string().url();
    const validUrl = data.get('url')
    urlSchema.validate(validUrl)
        .then(isValid => {
            console.log(isValid);
        })
        .catch(error => {
            console.error('Validation error:', error.message);
        });
    // console.log(data.get('url'));
})
