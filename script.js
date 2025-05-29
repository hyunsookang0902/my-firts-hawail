// 전역 변수로 이동
let events = {};
let selectedDate = null;
let updateCalendar;
let updateScheduleList;

// 폼 관련 전역 변수
const scheduleFormContainer = document.getElementById('scheduleFormContainer');
const addNewScheduleBtn = document.getElementById('addNewScheduleBtn');
const cancelBtn = document.getElementById('cancelBtn');

// 전역 변수로 이동
let selectedHourValue = null;
let selectedMinuteValue = null;
let selectedPeriodValue = null;

document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    events = JSON.parse(localStorage.getItem('events')) || {};
    let editingEventId = null;

    // 내보내기/가져오기 버튼 이벤트 리스너 추가
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importInput').addEventListener('change', handleFileSelect);

    const calendar = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const addScheduleForm = document.getElementById('addScheduleForm');
    const scheduleList = document.getElementById('scheduleList');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');

    // 시간 선택기 요소
    const timeDisplay = document.getElementById('scheduleTimeDisplay');
    const timeSelector = document.getElementById('timeSelector');
    const selectedTimeSpan = document.getElementById('selectedTime');
    const scheduleTimeInput = document.getElementById('scheduleTime');
    const hourOptions = document.getElementById('hourOptions');
    const minuteOptions = document.getElementById('minuteOptions');
    const periodOptions = document.getElementById('periodOptions');

    const searchMapBtn = document.getElementById('searchMapBtn');

    // 공휴일 목록 (2024년 기준)
    const holidays = {
        '2024-01-01': '신정',
        '2024-02-09': '설날',
        '2024-02-10': '설날',
        '2024-02-11': '설날',
        '2024-02-12': '대체공휴일',
        '2024-03-01': '삼일절',
        '2024-04-10': '21대 총선',
        '2024-05-05': '어린이날',
        '2024-05-06': '대체공휴일',
        '2024-05-15': '부처님오신날',
        '2024-06-06': '현충일',
        '2024-08-15': '광복절',
        '2024-09-16': '추석',
        '2024-09-17': '추석',
        '2024-09-18': '추석',
        '2024-10-03': '개천절',
        '2024-10-09': '한글날',
        '2024-12-25': '크리스마스'
    };

    // 선택 완료 여부 확인
    function isTimeSelectionComplete() {
        return selectedHourValue && selectedMinuteValue && selectedPeriodValue;
    }

    // 선택된 시간 업데이트 - 전역 함수로 이동
    function updateSelectedTime() {
        const hour = selectedHourValue || hourOptions.querySelector('.selected')?.dataset.value || '12';
        const minute = selectedMinuteValue || minuteOptions.querySelector('.selected')?.dataset.value || '00';
        const period = selectedPeriodValue || periodOptions.querySelector('.selected')?.dataset.value || 'AM';

        const hour24 = period === 'PM' && hour !== '12' 
            ? parseInt(hour) + 12 
            : (period === 'AM' && hour === '12' ? 0 : hour);

        const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        scheduleTimeInput.value = timeString;
        selectedTimeSpan.textContent = `${hour}:${minute.toString().padStart(2, '0')} ${period === 'AM' ? '오전' : '오후'}`;

        // 모든 값이 선택되었을 때만 선택기 닫기
        if (isTimeSelectionComplete()) {
            closeTimeSelector();
        }
    }

    // 시간 선택기 닫기 함수 - 전역으로 이동
    function closeTimeSelector() {
        timeSelector.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 시간 설정 함수 수정
    function setTime(timeString) {
        if (!timeString) return;

        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const minute = parseInt(minutes);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;

        selectedHourValue = hour12.toString();
        selectedMinuteValue = minutes;
        selectedPeriodValue = period;

        // 옵션 선택
        hourOptions.querySelectorAll('.time-option').forEach(option => {
            if (parseInt(option.dataset.value) === hour12) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        minuteOptions.querySelectorAll('.time-option').forEach(option => {
            if (parseInt(option.dataset.value) === minute) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        periodOptions.querySelectorAll('.time-option').forEach(option => {
            if (option.dataset.value === period) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        updateSelectedTime();
    }

    // 기본 시간 설정 함수 추가
    function setDefaultTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = Math.floor(now.getMinutes() / 5) * 5;
        setTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    // 시간 선택기 초기화
    function initializeTimePicker() {
        // 시간 옵션 생성
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('div');
            option.className = 'time-option';
            option.textContent = i.toString().padStart(2, '0');
            option.dataset.value = i;
            hourOptions.appendChild(option);
        }

        // 분 옵션 생성
        for (let i = 0; i < 60; i += 5) {
            const option = document.createElement('div');
            option.className = 'time-option';
            option.textContent = i.toString().padStart(2, '0');
            option.dataset.value = i;
            minuteOptions.appendChild(option);
        }

        // 시간 선택기 토글
        timeDisplay.addEventListener('click', function(e) {
            e.stopPropagation();
            timeSelector.classList.toggle('active');
            
            if (timeSelector.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // 시간 옵션 선택 이벤트
        hourOptions.querySelectorAll('.time-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                hourOptions.querySelector('.selected')?.classList.remove('selected');
                this.classList.add('selected');
                selectedHourValue = this.dataset.value;
                updateSelectedTime();
            });
        });

        // 분 옵션 선택 이벤트
        minuteOptions.querySelectorAll('.time-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                minuteOptions.querySelector('.selected')?.classList.remove('selected');
                this.classList.add('selected');
                selectedMinuteValue = this.dataset.value;
                updateSelectedTime();
            });
        });

        // 오전/오후 선택 이벤트
        periodOptions.querySelectorAll('.time-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                periodOptions.querySelector('.selected')?.classList.remove('selected');
                this.classList.add('selected');
                selectedPeriodValue = this.dataset.value;
                updateSelectedTime();
            });
        });

        // 시간 선택기 영역 클릭 시 이벤트 전파 중단
        timeSelector.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // 문서 클릭시 시간 선택기 닫기
        document.addEventListener('click', function(e) {
            if (!timeSelector.contains(e.target) && !timeDisplay.contains(e.target)) {
                closeTimeSelector();
            }
        });

        // 모바일에서 터치 이벤트 처리
        document.addEventListener('touchstart', function(e) {
            if (!timeSelector.contains(e.target) && !timeDisplay.contains(e.target)) {
                closeTimeSelector();
            }
        });
    }

    // updateCalendar 함수를 전역 변수에 할당
    updateCalendar = function() {
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        currentMonthElement.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
        calendar.innerHTML = '';
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendar.appendChild(emptyDay);
        }
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // 일요일이거나 공휴일인 경우 holiday 클래스 추가
            const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay();
            if (dayOfWeek === 0 || holidays[currentDateString]) {
                dayElement.classList.add('holiday');
            }
            
            if (isToday(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))) {
                dayElement.classList.add('today');
            }
            
            // 일정 유형에 따른 클래스 추가
            const dayEvents = getEventsByDate(currentDateString);
            if (dayEvents.length > 0) {
                dayElement.classList.add('has-event');
                if (dayEvents.some(event => event.isDeparture)) {
                    dayElement.classList.add('is-departure');
                }
                if (dayEvents.some(event => event.isArrival)) {
                    dayElement.classList.add('is-arrival');
                }
            }

            if (currentDateString === selectedDate) {
                dayElement.classList.add('selected');
            }
            
            dayElement.addEventListener('click', () => {
                selectedDate = currentDateString;
                document.getElementById('scheduleDate').value = currentDateString;
                if (!editingEventId) {
                    setDefaultTime();
                }
                updateCalendar();
                updateScheduleList(currentDateString);
            });
            
            calendar.appendChild(dayElement);
        }
    }

    function hasEvents(dateString) {
        return Object.keys(events).some(key => key.startsWith(dateString));
    }

    function formatTime(timeString) {
        // 시간을 12시간 형식으로 변환
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? '오후' : '오전';
        const hour12 = hour % 12 || 12;
        return `${ampm} ${hour12}:${minutes}`;
    }

    function getEventsByDate(dateString) {
        return Object.entries(events)
            .filter(([key]) => key.startsWith(dateString))
            .map(([key, value]) => ({id: key, ...value}))
            .sort((a, b) => {
                // 시간 기준으로 정렬
                const timeA = a.time || '00:00';
                const timeB = b.time || '00:00';
                return timeA.localeCompare(timeB);
            });
    }

    function formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return date.toLocaleDateString('ko-KR', options);
    }

    // updateScheduleList 함수를 전역 변수에 할당
    updateScheduleList = function(dateString) {
        scheduleList.innerHTML = '<div class="schedule-timeline"></div>';
        const selectedDateDisplay = document.getElementById('selectedDateDisplay');
        selectedDateDisplay.textContent = formatDateForDisplay(dateString);
        
        const dayEvents = getEventsByDate(dateString);
        
        if (dayEvents.length === 0) {
            const noEvents = document.createElement('div');
            noEvents.className = 'no-events';
            noEvents.textContent = '등록된 일정이 없습니다.';
            scheduleList.appendChild(noEvents);
            return;
        }

        document.removeEventListener('click', handleDocumentClick);

        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'schedule-item';
            
            // 제목과 지도 버튼을 포함하는 컨테이너 생성
            const titleContainer = document.createElement('div');
            titleContainer.className = 'title-container';

            // 제목에 URL이 있는 경우와 없는 경우 분기 처리
            const titleHtml = event.url 
                ? `<h4><a href="${event.url}" target="_blank" onclick="event.stopPropagation()">${event.title}</a></h4>`
                : `<h4>${event.title}</h4>`;
            
            // 지도 버튼 HTML (지도 URL이 있는 경우에만 표시)
            const mapButtonHtml = event.mapUrl 
                ? `<button class="view-map-btn" onclick="window.open('${event.mapUrl}', '_blank'); event.stopPropagation();" aria-label="지도 보기"></button>`
                : '';

            eventElement.innerHTML = `
                <div class="schedule-content">
                    <div class="title-container">
                        ${titleHtml}
                        ${mapButtonHtml}
                    </div>
                    <p class="event-time">${formatTime(event.time)}</p>
                    <p class="event-details">${event.details || ''}</p>
                </div>
                <div class="schedule-actions">
                    <button class="edit-btn" data-id="${event.id}">수정</button>
                    <button class="delete-btn" data-id="${event.id}">삭제</button>
                </div>
            `;

            let isActionVisible = false;

            // 일정 클릭 이벤트
            eventElement.addEventListener('click', function(e) {
                // URL이나 버튼 클릭은 무시
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                    return;
                }

                // 현재 아이템의 상태 토글
                isActionVisible = !isActionVisible;
                
                // 다른 모든 일정의 액션 메뉴 닫기
                const allItems = document.querySelectorAll('.schedule-item');
                allItems.forEach(item => {
                    if (item !== this) {
                        item.classList.remove('show-actions');
                    }
                });

                // 현재 아이템의 액션 메뉴 토글
                this.classList.toggle('show-actions');
            });

            // 수정 버튼 이벤트
            eventElement.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                editEvent(event);
                // 액션 메뉴 닫기
                eventElement.classList.remove('show-actions');
            });

            // 삭제 버튼 이벤트
            eventElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('이 일정을 삭제하시겠습니까?')) {
                    deleteEvent(event.id);
                }
            });

            scheduleList.appendChild(eventElement);
        });

        // 문서 클릭시 액션 메뉴 닫기
        function handleDocumentClick(e) {
            if (!e.target.closest('.schedule-item')) {
                const allItems = document.querySelectorAll('.schedule-item');
                allItems.forEach(item => item.classList.remove('show-actions'));
            }
        }

        document.addEventListener('click', handleDocumentClick);
    }

    function editEvent(event) {
        editingEventId = event.id;
        const [date, time] = event.id.split('T');
        
        document.getElementById('scheduleDate').value = date;
        setTime(event.time);
        document.getElementById('scheduleTitle').value = event.title;
        document.getElementById('scheduleUrl').value = event.url || '';
        document.getElementById('scheduleMapUrl').value = event.mapUrl || '';
        document.getElementById('scheduleDetails').value = event.details || '';
        document.getElementById('isDeparture').checked = event.isDeparture || false;
        document.getElementById('isArrival').checked = event.isArrival || false;
        
        showScheduleForm('edit');
    }

    function deleteEvent(eventId) {
        if (confirm('이 일정을 삭제하시겠습니까?')) {
            delete events[eventId];
            localStorage.setItem('events', JSON.stringify(events));
            updateCalendar();
            updateScheduleList(selectedDate);
        }
    }

    function resetForm() {
        editingEventId = null;
        addScheduleForm.reset();
        formTitle.textContent = '새 일정 추가';
        submitBtn.textContent = '일정 추가';
        
        if (selectedDate) {
            document.getElementById('scheduleDate').value = selectedDate;
            setDefaultTime();
        }
    }

    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    prevMonthButton.addEventListener('click', () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        updateCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        updateCalendar();
    });

    addScheduleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const title = document.getElementById('scheduleTitle').value;
        const url = document.getElementById('scheduleUrl').value.trim();
        const mapUrl = document.getElementById('scheduleMapUrl').value.trim();
        const details = document.getElementById('scheduleDetails').value;
        const isDeparture = document.getElementById('isDeparture').checked;
        const isArrival = document.getElementById('isArrival').checked;
        
        if (!time) {
            alert('시간을 입력해주세요.');
            return;
        }
        
        // URL 유효성 검사
        if ((url && !isValidUrl(url)) || (mapUrl && !isValidUrl(mapUrl))) {
            alert('올바른 URL 형식이 아닙니다.');
            return;
        }
        
        const eventId = editingEventId || `${date}T${time}`;
        
        if (!editingEventId && events[eventId]) {
            alert('해당 시간에 이미 일정이 존재합니다. 다른 시간을 선택해주세요.');
            return;
        }
        
        events[eventId] = {
            title: title,
            time: time,
            url: url,
            mapUrl: mapUrl,
            details: details,
            isDeparture: isDeparture,
            isArrival: isArrival
        };
        
        localStorage.setItem('events', JSON.stringify(events));
        
        updateCalendar();
        updateScheduleList(date);
        resetForm();
        
        alert(editingEventId ? '일정이 수정되었습니다!' : '일정이 추가되었습니다!');
    });

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    cancelBtn.addEventListener('click', resetForm);

    // 지도 검색 버튼 클릭 이벤트
    searchMapBtn.addEventListener('click', function() {
        const address = document.getElementById('scheduleTitle').value;
        const searchQuery = encodeURIComponent(address || '');
        window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
    });

    // 데이터 내보내기 기능
    function exportData() {
        const data = {
            events: events,
            exportDate: new Date().toISOString()
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `travel_schedule_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 데이터 가져오기 기능
    function importData(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data && data.events) {
                    if (confirm('기존 일정을 새로운 일정으로 대체하시겠습니까?')) {
                        events = data.events;
                        localStorage.setItem('events', JSON.stringify(events));
                        updateCalendar();
                        if (selectedDate) {
                            updateScheduleList(selectedDate);
                        }
                        alert('일정을 성공적으로 가져왔습니다.');
                    }
                } else {
                    alert('올바른 형식의 파일이 아닙니다.');
                }
            } catch (error) {
                alert('파일을 읽는 중 오류가 발생했습니다.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    // 파일 입력 변경 이벤트 핸들러
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            importData(file);
        }
        // 같은 파일을 다시 선택할 수 있도록 value 초기화
        event.target.value = '';
    }

    // 초기화
    initializeTimePicker();
    updateCalendar();
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    document.getElementById('scheduleDate').value = todayString;
    setDefaultTime();
    updateScheduleList(todayString);

    // 새 일정 추가 버튼 클릭 이벤트
    addNewScheduleBtn.addEventListener('click', () => {
        showScheduleForm('add');
    });

    // 취소 버튼 클릭 이벤트
    cancelBtn.addEventListener('click', () => {
        hideScheduleForm();
    });

    // 폼 표시 함수
    function showScheduleForm(mode) {
        scheduleFormContainer.style.display = 'block';
        formTitle.textContent = mode === 'add' ? '새 일정 추가' : '일정 수정';
        submitBtn.textContent = mode === 'add' ? '일정 추가' : '일정 수정';
        cancelBtn.style.display = 'block';
        
        // 폼이 보이도록 스크롤
        scheduleFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 폼 숨김 함수
    function hideScheduleForm() {
        scheduleFormContainer.style.display = 'none';
        resetForm();
    }

    // 기존 수정 버튼 클릭 이벤트 수정
    function handleEditClick(schedule) {
        showScheduleForm('edit');
        // ... 기존 수정 로직 ...
    }

    // 페이지 로드시 폼 숨기기
    document.addEventListener('DOMContentLoaded', () => {
        hideScheduleForm();
        // ... 기존 초기화 로직 ...
    });
}); 