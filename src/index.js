import  './styles.scss';
import  'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';


const form = document.querySelector('.rss-form');
const input = form.querySelector('input');
const errorMessageEl = document.querySelector('.feedback');

const state = {
    form: {
        isValid: true,
        errorMessage: '',
    },
    uiState: {}
}

const renderForm = (state) => {
    input.classList.remove('is-invalid');
    errorMessageEl.classList.remove('text-danger');
    errorMessageEl.textContent = '';
    if(!state.form.isValid) {
        input.classList.add('is-invalid');
        errorMessageEl.classList.add('text-danger');
        errorMessageEl.textContent = state.form.errorMessage;
    }
}

const watchedState = onChange(state, (path, value, previousValue) => {
    if (path === "form.isValid" && value !== previousValue) {
        renderForm(watchedState);
    }
    
})
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const urlSchema = yup.string().url();
    const validUrl = data.get('url')
    urlSchema.validate(validUrl)
        .then(() => {
            watchedState.form.errorMessage = '';
            watchedState.form.isValid = true;
        })
        .catch(error => {
            watchedState.form.errorMessage = error.message;
            watchedState.form.isValid = false;
        });
    // console.log(data.get('url'));
})
