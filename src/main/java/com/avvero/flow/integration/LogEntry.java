package com.avvero.flow.integration;

import ch.qos.logback.classic.spi.LoggingEventVO;

import java.time.Instant;

/**
 * @author Avvero
 */
public class LogEntry {

    private long nanoTime;
    private LoggingEventVO event;

    public LogEntry() {
        nanoTime = System.nanoTime();
    }

    public LogEntry(LoggingEventVO event) {
        this();
        this.event = event;
    }

    public long getNanoTime() {
        return nanoTime;
    }

    public void setNanoTime(long nanoTime) {
        this.nanoTime = nanoTime;
    }

    public LoggingEventVO getEvent() {
        return event;
    }

    public void setEvent(LoggingEventVO event) {
        this.event = event;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        LogEntry logEntry = (LogEntry) o;

        if (nanoTime != logEntry.nanoTime) return false;
        return !(event != null ? !event.equals(logEntry.event) : logEntry.event != null);

    }

    @Override
    public int hashCode() {
        int result = (int) (nanoTime ^ (nanoTime >>> 32));
        result = 31 * result + (event != null ? event.hashCode() : 0);
        return result;
    }

    @Override
    public String toString() {
        return "LogEntry{" +
                "nanoTime=" + nanoTime +
                ", event=" + event +
                '}';
    }
}
