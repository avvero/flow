package com.avvero.flow.integration;

import com.google.gson.Gson;

import java.util.List;

/**
 * Created by fxdev-belyaev-ay on 27.10.16.
 */
public class Wave {

    private static Gson GSON = new Gson();

    private String marker;
    private List<String> levels;

    public String getMarker() {
        return marker;
    }

    public void setMarker(String marker) {
        this.marker = marker;
    }

    public List<String> getLevels() {
        return levels;
    }

    public void setLevels(List<String> levels) {
        this.levels = levels;
    }

    static public Wave from(String string) {
        return GSON.fromJson(string, Wave.class);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Wave wave = (Wave) o;

        if (marker != null ? !marker.equals(wave.marker) : wave.marker != null) return false;
        return levels != null ? levels.equals(wave.levels) : wave.levels == null;

    }

    @Override
    public int hashCode() {
        int result = marker != null ? marker.hashCode() : 0;
        result = 31 * result + (levels != null ? levels.hashCode() : 0);
        return result;
    }

    @Override
    public String toString() {
        return "Wave{" +
                "marker='" + marker + '\'' +
                ", levels=" + levels +
                '}';
    }
}
