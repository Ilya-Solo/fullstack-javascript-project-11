import  './styles.scss';
import  'bootstrap';
import onChange from 'on-change';
import * as yup from 'yup';


const form = document.querySelector('.rss-form');
const input = form.querySelector('input');
const validationMessageEl = document.querySelector('.feedback');

const state = {
    form: {
        isValid: null,
        validationMessage: '',
    },
    streams: [],
    uiState: {}
}

const renderForm = (state) => {
    input.classList.remove('is-invalid');
    validationMessageEl.classList.remove('text-danger', 'text-success');
    validationMessageEl.textContent = '';

    if(!state.form.isValid) {
        input.classList.add('is-invalid');
        validationMessageEl.classList.add('text-danger');
        validationMessageEl.textContent = state.form.validationMessage;
    } else {
        form.reset();
        validationMessageEl.classList.add('text-success');
        validationMessageEl.textContent = state.form.validationMessage;
    }
}

const watchedState = onChange(state, (path, value, previousValue) => {
    if (path === "form.isValid" || path === "form.validationMessage") {
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
            if (watchedState.streams.includes(validUrl)) {
                throw new Error('RSS уже существует');
            }
        })
        .then(() => {
            watchedState.streams.push(validUrl);
            watchedState.form.validationMessage = 'RSS успешно загружен'
            watchedState.form.isValid = true;
        })
        .catch(error => {
            watchedState.form.validationMessage = '';
            watchedState.form.validationMessage = error.message;
            watchedState.form.isValid = false;
        });
    // console.log(data.get('url'));
})
