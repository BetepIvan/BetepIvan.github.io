        // API Key для OMDB
        const API_KEY = '810a0bf9';
        
        // База данных в localStorage
        let movieAppDB = {
            users: [],
            favorites: {}
        };
        
        let currentUser = null;

        // Инициализация при загрузке DOM
        document.addEventListener('DOMContentLoaded', function() {
            initDB();
            setupEventListeners();
        });

        // Настройка обработчиков событий
        function setupEventListeners() {
            // Переключение между формами
            document.getElementById('show-register').addEventListener('click', showRegisterForm);
            document.getElementById('show-login').addEventListener('click', showLoginForm);
            
            // Форма регистрации
            document.getElementById('register-form').addEventListener('submit', function(e) {
                e.preventDefault();
                register();
            });
            
            // Форма входа
            document.getElementById('login-form').addEventListener('submit', function(e) {
                e.preventDefault();
                login();
            });
            
            // Кнопка выхода
            document.getElementById('logout-btn').addEventListener('click', logout);
            
            // Форма поиска
            document.getElementById('search-form').addEventListener('submit', function(e) {
                e.preventDefault();
                searchMovies();
            });
            
            // Кнопка избранного
            document.getElementById('favorites-button').addEventListener('click', showFavorites);
            
            // Модальное окно
            document.querySelector('.close').addEventListener('click', closeModal);
            window.addEventListener('click', function(event) {
                if (event.target === document.getElementById('movie-modal')) {
                    closeModal();
                }
            });
        }

        // Инициализация базы данных
        function initDB() {
            const savedDB = localStorage.getItem('movieAppDB');
            if (savedDB) {
                try {
                    movieAppDB = JSON.parse(savedDB);
                } catch (e) {
                    console.error('Ошибка при чтении базы данных:', e);
                    resetDB();
                }
            } else {
                resetDB();
            }
            
            checkLoggedIn();
        }

        // Сброс базы данных
        function resetDB() {
            movieAppDB = {
                users: [],
                favorites: {}
            };
            saveDB();
        }

        // Сохранение базы данных
        function saveDB() {
            localStorage.setItem('movieAppDB', JSON.stringify(movieAppDB));
        }

        // Проверка авторизации пользователя
        function checkLoggedIn() {
            const savedUser = localStorage.getItem('movieAppCurrentUser');
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    const dbUser = movieAppDB.users.find(u => u.id === user.id);
                    if (dbUser) {
                        currentUser = dbUser;
                        showMovieSearch();
                    }
                } catch (e) {
                    console.error('Ошибка при чтении данных пользователя:', e);
                    localStorage.removeItem('movieAppCurrentUser');
                }
            }
        }

        // Регистрация нового пользователя
        function register() {
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;
            const errorElement = document.getElementById('register-error');
            
            // Валидация
            errorElement.textContent = '';
            
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
            
            // Создание нового пользователя
            const newUser = {
                id: Date.now(),
                name,
                email,
                password: simpleHash(password) // Простое хеширование
            };
            
            // Добавление в базу данных
            movieAppDB.users.push(newUser);
            movieAppDB.favorites[newUser.id] = [];
            saveDB();
            
            // Автоматический вход
            currentUser = newUser;
            localStorage.setItem('movieAppCurrentUser', JSON.stringify(newUser));
            showMovieSearch();
            document.getElementById('register-form').reset();
        }

        // Простое хеширование пароля (для демонстрации)
        function simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0; // Преобразование в 32-битное целое число
            }
            return hash.toString();
        }

        // Вход пользователя
        function login() {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const errorElement = document.getElementById('login-error');
            
            // Валидация
            errorElement.textContent = '';
            
            if (!email || !password) {
                errorElement.textContent = 'Пожалуйста, заполните все поля';
                return;
            }
            
            // Поиск пользователя
            const user = movieAppDB.users.find(u => 
                u.email === email && 
                u.password === simpleHash(password)
            );
            
            if (user) {
                currentUser = user;
                localStorage.setItem('movieAppCurrentUser', JSON.stringify(user));
                showMovieSearch();
                document.getElementById('login-form').reset();
            } else {
                errorElement.textContent = 'Неверный email или пароль';
            }
        }

        // Выход пользователя
        function logout() {
            currentUser = null;
            localStorage.removeItem('movieAppCurrentUser');
            document.querySelector('.container').classList.remove('hidden');
            document.querySelector('.container-movie').classList.add('hidden');
            document.getElementById('movie-search').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
            clearFormFields();
        }

        // Показать интерфейс поиска фильмов
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

        // Очистка полей форм
        function clearFormFields() {
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            document.getElementById('register-name').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-confirm').value = '';
            document.getElementById('search-input').value = '';
        }

        // Очистка сообщений об ошибках
        function clearErrors() {
            document.getElementById('login-error').textContent = '';
            document.getElementById('register-error').textContent = '';
        }

        // Поиск фильмов через OMDB API
        async function searchMovies() {
            const searchTerm = document.getElementById('search-input').value.trim();
            const type = document.getElementById('type-select').value;
            
            if (!searchTerm) {
                alert('Пожалуйста, введите поисковый запрос');
                return;
            }
            
            showLoading(true);
            clearError();
            
            try {
                let url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}`;
                if (type) url += `&type=${type}`;
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.Response === 'True') {
                    displayMovies(data.Search);
                } else {
                    showError(data.Error || 'Фильмы не найдены');
                }
            } catch (error) {
                showError('Ошибка при поиске фильмов: ' + error.message);
                console.error('Ошибка поиска:', error);
            } finally {
                showLoading(false);
            }
        }

        // Отображение списка фильмов
        function displayMovies(movies) {
            const container = document.getElementById('movies-container');
            container.innerHTML = '';
            
            if (!movies || movies.length === 0) {
                container.innerHTML = '<p>Фильмы не найдены</p>';
                return;
            }
            
            const fragment = document.createDocumentFragment();
            
            movies.forEach(movie => {
                const isFavorite = currentUser && 
                    movieAppDB.favorites[currentUser.id]?.includes(movie.imdbID);
                
                const movieCard = document.createElement('div');
                movieCard.className = 'movie-card';
                
                // Безопасное создание элементов
                const img = document.createElement('img');
                img.src = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
                img.alt = movie.Title;
                
                const title = document.createElement('h3');
                title.textContent = `${movie.Title} (${movie.Year})`;
                
                const type = document.createElement('p');
                type.textContent = `Тип: ${movie.Type}`;
                
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'details-btn';
                detailsBtn.textContent = 'Подробности';
                detailsBtn.dataset.imdbid = movie.imdbID;
                
                const favBtn = document.createElement('button');
                favBtn.className = `favorite-btn ${isFavorite ? 'favorited' : ''}`;
                favBtn.textContent = isFavorite ? '❤️ В избранном' : '❤️ В избранное';
                favBtn.dataset.imdbid = movie.imdbID;
                
                // Добавление элементов в карточку
                movieCard.appendChild(img);
                movieCard.appendChild(title);
                movieCard.appendChild(type);
                movieCard.appendChild(detailsBtn);
                movieCard.appendChild(favBtn);
                
                // Добавление обработчиков
                detailsBtn.addEventListener('click', () => showMovieDetails(movie.imdbID));
                favBtn.addEventListener('click', () => toggleFavorite(movie.imdbID, favBtn));
                
                fragment.appendChild(movieCard);
            });
            
            container.appendChild(fragment);
        }

        // Показать детали фильма
        async function showMovieDetails(imdbID) {
            showLoading(true);
            
            try {
                const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}&plot=full`);
                
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                
                const movie = await response.json();
                
                if (movie.Response === 'True') {
                    displayMovieDetails(movie);
                } else {
                    showError(movie.Error || 'Не удалось загрузить детали фильма');
                }
            } catch (error) {
                showError('Ошибка при загрузке деталей фильма: ' + error.message);
                console.error('Ошибка загрузки деталей:', error);
            } finally {
                showLoading(false);
            }
        }

        // Отображение деталей фильма в модальном окне
        function displayMovieDetails(movie) {
            const isFavorite = currentUser && 
                movieAppDB.favorites[currentUser.id]?.includes(movie.imdbID);
            
            const details = document.getElementById('movie-details');
            details.innerHTML = '';
            
            // Безопасное создание элементов
            const title = document.createElement('h2');
            title.textContent = `${movie.Title} (${movie.Year})`;
            
            const flexContainer = document.createElement('div');
            flexContainer.style.display = 'flex';
            flexContainer.style.gap = '20px';
            flexContainer.style.marginTop = '20px';
            
            // Левая колонка (постер и кнопка)
            const leftCol = document.createElement('div');
            leftCol.style.flex = '1';
            
            const posterImg = document.createElement('img');
            posterImg.src = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
            posterImg.alt = movie.Title;
            posterImg.style.maxWidth = '100%';
            
            const favBtn = document.createElement('button');
            favBtn.className = `favorite-btn ${isFavorite ? 'favorited' : ''}`;
            favBtn.textContent = isFavorite ? '❤️ В избранном' : '❤️ В избранное';
            favBtn.dataset.imdbid = movie.imdbID;
            favBtn.style.marginTop = '10px';
            favBtn.style.width = '100%';
            
            leftCol.appendChild(posterImg);
            leftCol.appendChild(favBtn);
            
            // Правая колонка (детали)
            const rightCol = document.createElement('div');
            rightCol.style.flex = '2';
            
            // Добавление деталей фильма
            const detailsToShow = [
                { label: 'Рейтинг', value: movie.Rated },
                { label: 'Дата выхода', value: movie.Released },
                { label: 'Продолжительность', value: movie.Runtime },
                { label: 'Жанр', value: movie.Genre },
                { label: 'Режиссер', value: movie.Director },
                { label: 'Сценарист', value: movie.Writer },
                { label: 'Актеры', value: movie.Actors },
                { label: 'Сюжет', value: movie.Plot },
                { label: 'Язык', value: movie.Language },
                { label: 'Страна', value: movie.Country },
                { label: 'Награды', value: movie.Awards },
                { label: 'IMDb Рейтинг', value: movie.imdbRating },
                { label: 'IMDb Голоса', value: movie.imdbVotes },
                { label: 'Тип', value: movie.Type }
            ];
            
            detailsToShow.forEach(detail => {
                if (detail.value && detail.value !== 'N/A') {
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
                    rightCol.appendChild(p);
                }
            });
            
            if (movie.totalSeasons) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Всего сезонов:</strong> ${movie.totalSeasons}`;
                rightCol.appendChild(p);
            }
            
            // Сборка модального окна
            flexContainer.appendChild(leftCol);
            flexContainer.appendChild(rightCol);
            
            details.appendChild(title);
            details.appendChild(flexContainer);
            
            // Обработчик для кнопки избранного
            favBtn.addEventListener('click', function() {
                toggleFavorite(this.dataset.imdbid, this);
            });
            
            openModal();
        }

        // Переключение избранного статуса
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
                // Добавить в избранное
                movieAppDB.favorites[currentUser.id].push(imdbID);
                if (button) {
                    button.textContent = '❤️ В избранном';
                    button.classList.add('favorited');
                }
            } else {
                // Удалить из избранного
                movieAppDB.favorites[currentUser.id].splice(index, 1);
                if (button) {
                    button.textContent = '❤️ В избранное';
                    button.classList.remove('favorited');
                }
            }
            
            saveDB();
        }

        // Показать избранные фильмы
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
                            .then(res => {
                                if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
                                return res.json();
                            })
                            .catch(error => {
                                console.error(`Ошибка загрузки фильма ${id}:`, error);
                                return null;
                            })
                    )
                );
                
                // Фильтрация неудачных запросов
                const validMovies = movies.filter(movie => movie && movie.Response === 'True');
                displayMovies(validMovies);
                
                if (validMovies.length !== movies.length) {
                    showError('Не удалось загрузить некоторые избранные фильмы');
                }
            } catch (error) {
                showError('Ошибка при загрузке избранных фильмов: ' + error.message);
                console.error('Ошибка загрузки избранного:', error);
            } finally {
                showLoading(false);
            }
        }

        // Управление модальным окном
        function openModal() {
            document.getElementById('movie-modal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('movie-modal').style.display = 'none';
        }

        // Вспомогательные функции UI
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

        // Переключение между формами
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