import os
from pathlib import Path
from datetime import timedelta
from celery.schedules import crontab

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-u4ui3@x-ycfn0ajm2#7@scmky1tkuhdq0&*3@xy8ihm*fuq#oz'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'loan',
    'django_filters',
    'django_celery_results',
    'audit',
    'employee',
    'channels',
    'userauth', 
    "rest_framework_simplejwt.token_blacklist",
    
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit.middleware.AuditRequestMiddleware',  # Custom middleware for auditing
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
# Add this
ASGI_APPLICATION = 'config.asgi.application'

# Use Redis as channel layer backend
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],  # docker service name
        },
    },
}

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'loan',
        'USER': 'postgres',         
        'PASSWORD': '204612',  
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}



# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

# STATIC_URL = 'static/'
STATIC_URL = '/static/'


# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# CORS settings
CORS_ALLOW_ALL_ORIGINS = False  # For development only
CORS_ALLOW_CREDENTIALS = True 
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    
]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',  # Default for admin
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'userauth.authentication.CookieJWTAuthentication', # Custom authentication class
  ),
  'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,  # or smaller for large datasets
    
}
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    # ...
}

CSRF_COOKIE_SECURE = False  # Set to True in production
CSRF_COOKIE_SAMESITE = "Lax"  # Adjust based on your frontend/backend
CSRF_COOKIE_HTTPONLY = False  # so JS can read it
  # Prevents JavaScript access to CSRF cookie
SESSION_COOKIE_SECURE = False  # Set to True in production
SESSION_COOKIE_SAMESITE = 'Lax'  # Adjust based on your frontend/backend
SESSION_ENGINE = "django.contrib.sessions.backends.db"



CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",  # Separate DB for cache
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            # "IGNORE_EXCEPTIONS": True,  # Uncomment in production to avoid breaking app on cache errors
        },
    }
}

# -------------------------------
# Celery - Core
# -------------------------------
CELERY_BROKER_URL = "redis://127.0.0.1:6379/0"     # Redis DB 0 → Broker
CELERY_RESULT_BACKEND = "redis://127.0.0.1:6379/1" # Redis DB 1 → Results
CELERY_TIMEZONE = "America/Chicago"                # CST
CELERY_TASK_TRACK_STARTED = True                   # Track task start times
CELERY_TASK_TIME_LIMIT = 60 * 30                   # Hard timeout: 30 min
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ENABLE_UTC = False  # Important since we force CST
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True   # Ensures Celery waits for broker

# -------------------------------
# Celery - Task Retry Defaults
# -------------------------------
# Instead of hardcoding retries inside every task,
# you can configure global retry defaults here.
CELERY_TASK_DEFAULT_RETRY_DELAY = 30   # Initial retry delay in seconds
CELERY_TASK_ACKS_LATE = True           # Re-queue if worker crashes
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_DEFAULT_QUEUE = "default"

# -------------------------------
# Celery Beat Schedule
# -------------------------------
CELERY_BEAT_SCHEDULE = {
    # Every 2 seconds → Outbox publisher
    "publish-outbox-every-2s": {
        "task": "loan.tasks.publish_outbox",
        "schedule": 2.0,
    },

    # Daily at 23:59 CST → Auto mark absent or leave
    "auto-mark-attendance": {
        "task": "employee.tasks.auto_mark_absent_or_leave",
        "schedule": crontab(hour=23, minute=59),
    },

    # Daily at 12:00 CST → Check for late arrivals
    "check-late-midday": {
        "task": "employee.tasks.update_late_status",
        "schedule": crontab(hour=12, minute=0),
    },
}