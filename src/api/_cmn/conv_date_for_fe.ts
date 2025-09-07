export enum precision {
    YEAR = 'YEAR',
    MONTH = 'MONTH',
    DAY = 'DAY',
    HOUR = 'HOUR',
    MINUTE = 'MINUTE',
    SECOND = 'SECOND',
    MILLISECOND = 'MILLISECOND'
}

interface paesedDate {
    y: number
    m: number
    d: number
    h: number
    mn: number
    s: number
    ms: number
}

const isoLikeFmter = (d: paesedDate, precision: precision): string => {
    const pad = (n: number, z = 2) => ('00' + n).slice(-z);
    interface parsedDateFmted {
        y: string
        m: string
        d: string
        h: string
        mn: string
        s: string
        ms: string
    }
    const fd: parsedDateFmted = {
        y: `${d.y}`,
        m: pad(d.m),
        d: pad(d.d),
        h: pad(d.h),
        mn: pad(d.mn),
        s: pad(d.s),
        ms: pad(d.ms, 3)
    };

    switch (precision) {
        case 'YEAR':
            return `${fd.y}`;
        case 'MONTH':
            return `${fd.y}-${fd.m}`;
        case 'DAY':
            return `${fd.y}-${fd.m}-${fd.d}`;
        case 'HOUR':
            return `${fd.y}-${fd.m}-${fd.d} ${fd.h}`;
        case 'MINUTE':
            return `${fd.y}-${fd.m}-${fd.d} ${fd.h}:${fd.mn}`;
        case 'SECOND':
            return `${fd.y}-${fd.m}-${fd.d} ${fd.h}:${fd.mn}:${fd.s}`;
        case 'MILLISECOND':
            return `${fd.y}-${fd.m}-${fd.d} ${fd.h}:${fd.mn}:${fd.s}.${fd.ms}`;
        default:
            return `${fd.y}-${fd.m}-${fd.d} ${fd.h}:${fd.mn}:${fd.s}.${fd.ms}`;
    }
}

export const convDateForFE = (date: Date, precision: precision): string => {
    return isoLikeFmter({
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        mn: date.getMinutes(),
        s: date.getSeconds(),
        ms: date.getMilliseconds()
    }, precision);
};

export const convDurationForFE = (fdate: Date, tdate: Date, precision: precision): string => {
    const duration = tdate.getTime() - fdate.getTime();
    const milliseconds = duration % 1000;
    const seconds = Math.floor(duration / 1000) % 60;
    const minutes = Math.floor(duration / 60000) % 60;
    const hours = Math.floor(duration / 3600000) % 24;
    const days = Math.floor(duration / 86400000) % 30;
    const months = Math.floor(duration / 2592000000) % 12;
    const years = Math.floor(duration / 31536000000);

    const res = [];

    if (years > 0 && ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'MILLISECOND'].includes(precision)) {
        res.push(`${years}`);
    }
    if (months > 0 && ['MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'MILLISECOND'].includes(precision)) {
        res.push(`/${months}`);
    }
    if (days > 0 && ['DAY', 'HOUR', 'MINUTE', 'SECOND', 'MILLISECOND'].includes(precision)) {
        res.push(`/${days}`);
    }
    if (hours > 0 && ['HOUR', 'MINUTE', 'SECOND', 'MILLISECOND'].includes(precision)) {
        res.push(` ${hours}`);
    }
    if (minutes > 0 && ['MINUTE', 'SECOND', 'MILLISECOND'].includes(precision)) {
        res.push(`:${minutes}`);
    }
    if (seconds > 0 && ['SECOND', 'MILLISECOND'].includes(precision)) {
        res.push(`:${seconds}`);
    }
    if (milliseconds > 0 && ['MILLISECOND'].includes(precision)) {
        res.push(`.${milliseconds}`);
    }

    return `${res.join('')} ago`;
}

export const isValidISODate = (dateString: string): boolean => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}Z$/;
    return isoDateRegex.test(dateString);
};

export const isValidISODatetime = (datetimeString: string): boolean => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
    return isoDateRegex.test(datetimeString);
};
