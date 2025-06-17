const API_KEY = '810a0bf9';

let movieAppDB = {
    users: [],
    favorites: {}
};

let currentUser = null;
let currentPage = 1;
let totalResults = 0;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    initDB();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('show-register').addEventListener('click', showRegisterForm);
    document.getElementById('show-login').addEventListener('click', showLoginForm);
    
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await register();
    });
    
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await login();
    });
    
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    document.getElementById('search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        searchMovies();
    });
    
    document.getElementById('favorites-button').addEventListener('click', showFavorites);
    
    document.querySelector('.close-btn').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal();
    });
    
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('movie-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

function initDB() {
    const savedDB = localStorage.getItem('movieAppDB');
    if (savedDB) {
        movieAppDB = JSON.parse(savedDB);
    } else {
        movieAppDB = {
            users: [],
            favorites: {}
        };
        localStorage.setItem('movieAppDB', JSON.stringify(movieAppDB));
    }
    
    checkLoggedIn();
}

function saveDB() {
    localStorage.setItem('movieAppDB', JSON.stringify(movieAppDB));
}

function checkLoggedIn() {
    const savedUser = localStorage.getItem('movieAppCurrentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        const dbUser = movieAppDB.users.find(u => u.id === user.id);
        if (dbUser) {
            currentUser = dbUser;
            showMovieSearch();
        }
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorElement = document.getElementById('register-error');

    if (!name || !email || !password || !confirm) {
        errorElement.textContent = 'Пожалуйста, заполните все поля';
        return;
    }

    if (password !== confirm) {
        errorElement.textContent = 'Пароли не совпадают';
        return;
    }

    if (movieAppDB.users.some(u => u.email === email)) {
        errorElement.textContent = 'Email уже зарегистрирован';
        return;
    }

    try {
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password
        };

        movieAppDB.users.push(newUser);
        movieAppDB.favorites[newUser.id] = [];
        saveDB();

        currentUser = newUser;
        localStorage.setItem('movieAppCurrentUser', JSON.stringify(newUser));
        showMovieSearch();
        document.getElementById('register-form').reset();
    } catch (error) {
        errorElement.textContent = 'Ошибка регистрации: ' + error.message;
        console.error(error);
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    if (!email || !password) {
        errorElement.textContent = 'Пожалуйста, заполните все поля';
        return;
    }

    try {
        const user = movieAppDB.users.find(u => u.email === email && u.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem('movieAppCurrentUser', JSON.stringify(user));
            showMovieSearch();
            document.getElementById('login-form').reset();
            return;
        }

        errorElement.textContent = 'Неверный email или пароль';
    } catch (error) {
        errorElement.textContent = 'Ошибка входа: ' + error.message;
        console.error(error);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('movieAppCurrentUser');
    document.querySelector('.container').classList.remove('hidden');
    document.querySelector('.container-movie').classList.add('hidden');
    document.getElementById('movie-search').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    clearFormFields();
}

function showMovieSearch() {
    document.querySelector('.container').classList.add('hidden');
    document.querySelector('.container-movie').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('movie-search').classList.remove('hidden');
    document.getElementById('user-name').textContent = currentUser.name;
    clearFormFields();
    clearErrors();
}

function clearFormFields() {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';
    document.getElementById('search-input').value = '';
}

function clearErrors() {
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}

async function searchMovies() {
    const searchTerm = document.getElementById('search-input').value.trim();
    const type = document.getElementById('type-select').value;

    if (!searchTerm) {
        alert('Пожалуйста, введите поисковый запрос');
        return;
    }

    if (searchQuery !== searchTerm) {
        currentPage = 1;
        searchQuery = searchTerm;
    }

    showLoading(true);
    clearError();

    try {
        let url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}&page=${currentPage}`;
        if (type) url += `&type=${type}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === 'True') {
            totalResults = parseInt(data.totalResults);
            displayMovies(data.Search);
            setupPagination();
        } else {
            showError(data.Error || 'Фильмы не найдены');
        }
    } catch (error) {
        showError('Ошибка при поиске фильмов');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function displayMovies(movies) {
    const container = document.getElementById('movies-container');
    container.innerHTML = '';

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p>Фильмы не найдены</p>';
        return;
    }

    movies.forEach(movie => {
        const isFavorite = currentUser &&
            movieAppDB.favorites[currentUser.id]?.includes(movie.imdbID);

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${movie.Title}">
            <h3>${movie.Title} (${movie.Year})</h3>
            <p>Тип: ${movie.Type}</p>
            <button class="details-btn" data-imdbid="${movie.imdbID}">Подробности</button>
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                    data-imdbid="${movie.imdbID}">
                ${isFavorite ? '❤️ В избранном' : '❤️ В избранное'}
            </button>
        `;

        container.appendChild(movieCard);
    });

    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', () => showMovieDetails(btn.dataset.imdbid));
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleFavorite(btn.dataset.imdbid, btn));
    });
}

async function showMovieDetails(imdbID) {
    showLoading(true);

    try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const movie = await response.json();

        if (movie.Response === 'True') {
            displayMovieDetails(movie);
        } else {
            showError('Не удалось загрузить детали фильма');
        }
    } catch (error) {
        showError('Ошибка при загрузке деталей фильма');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function displayMovieDetails(movie) {
    const isFavorite = currentUser &&
        movieAppDB.favorites[currentUser.id]?.includes(movie.imdbID);

    const details = document.getElementById('movie-details');
    details.innerHTML = `
        <h2>${movie.Title} (${movie.Year})</h2>
        <div style="display: flex; gap: 20px; margin-top: 20px;">
            <div style="flex: 1;">
                <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}" 
                     alt="${movie.Title}" style="max-width: 100%;">
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
                        data-imdbid="${movie.imdbID}" 
                        style="margin-top: 10px; width: 100%;">
                    ${isFavorite ? '❤️ В избранном' : '❤️ В избранное'}
                </button>
            </div>
            <div style="flex: 2;">
                <p><strong>Рейтинг:</strong> ${movie.Rated}</p>
                <p><strong>Дата выхода:</strong> ${movie.Released}</p>
                <p><strong>Продолжительность:</strong> ${movie.Runtime}</p>
                <p><strong>Жанр:</strong> ${movie.Genre}</p>
                <p><strong>Режиссер:</strong> ${movie.Director}</p>
                <p><strong>Сценарист:</strong> ${movie.Writer}</p>
                <p><strong>Актеры:</strong> ${movie.Actors}</p>
                <p><strong>Сюжет:</strong> ${movie.Plot}</p>
                <p><strong>Язык:</strong> ${movie.Language}</p>
                <p><strong>Страна:</strong> ${movie.Country}</p>
                <p><strong>Награды:</strong> ${movie.Awards}</p>
                <p><strong>IMDb Рейтинг:</strong> ${movie.imdbRating}</p>
                <p><strong>IMDb Голоса:</strong> ${movie.imdbVotes}</p>
                <p><strong>Тип:</strong> ${movie.Type}</p>
                ${movie.totalSeasons ? `<p><strong>Всего сезонов:</strong> ${movie.totalSeasons}</p>` : ''}
            </div>
        </div>
    `;

    details.querySelector('.favorite-btn').addEventListener('click', function(e) {
        e.preventDefault();
        toggleFavorite(this.dataset.imdbid, this);
    });

    openModal();
}

function toggleFavorite(imdbID, button) {
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }

    if (!movieAppDB.favorites[currentUser.id]) {
        movieAppDB.favorites[currentUser.id] = [];
    }

    const index = movieAppDB.favorites[currentUser.id].indexOf(imdbID);

    if (index === -1) {
        movieAppDB.favorites[currentUser.id].push(imdbID);
        if (button) {
            button.textContent = '❤️ В избранном';
            button.classList.add('favorited');
        }
    } else {
        movieAppDB.favorites[currentUser.id].splice(index, 1);
        if (button) {
            button.textContent = '❤️ В избранное';
            button.classList.remove('favorited');
        }
    }

    saveDB();
}

async function showFavorites() {
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }

    const favorites = movieAppDB.favorites[currentUser.id] || [];

    if (favorites.length === 0) {
        document.getElementById('movies-container').innerHTML = '<p>У вас пока нет избранных фильмов</p>';
        return;
    }

    showLoading(true);
    clearError();

    try {
        const movies = await Promise.all(
            favorites.map(id =>
                fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`)
                    .then(res => res.json())
            )
        );

        displayMovies(movies);
    } catch (error) {
        showError('Ошибка при загрузке избранных фильмов');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function openModal() {
    document.getElementById('movie-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('movie-modal').style.display = 'none';
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

function clearError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    clearErrors();
}

function showLoginForm() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    clearErrors();
}

function setupPagination() {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalResults / 10);

    if (totalPages <= 1) return;

    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Назад';
        prevBtn.addEventListener('click', () => {
            currentPage--;
            searchMovies();
        });
        paginationContainer.appendChild(prevBtn);
    }

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            searchMovies();
        });
        paginationContainer.appendChild(pageBtn);
    }

    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Вперед →';
        nextBtn.addEventListener('click', () => {
            currentPage++;
            searchMovies();
        });
        paginationContainer.appendChild(nextBtn);
    }
}