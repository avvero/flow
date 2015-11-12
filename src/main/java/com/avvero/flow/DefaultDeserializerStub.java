package com.avvero.flow;

import org.springframework.core.ConfigurableObjectInputStream;
import org.springframework.core.NestedIOException;
import org.springframework.core.serializer.DefaultDeserializer;

import java.io.IOException;
import java.io.InputStream;
import java.io.ObjectInputStream;

/**
 * @author fxdev-belyaev-ay
 */
public class DefaultDeserializerStub extends DefaultDeserializer {

    private final ClassLoader classLoader;


    /**
     * Create a {@code DefaultDeserializer} with default {@link ObjectInputStream}
     * configuration, using the "latest user-defined ClassLoader".
     */
    public DefaultDeserializerStub() {
        this.classLoader = null;
    }

    /**
     * Create a {@code DefaultDeserializer} for using an {@link ObjectInputStream}
     * with the given {@code ClassLoader}.
     * @since 4.2.1
     * @see ConfigurableObjectInputStream#ConfigurableObjectInputStream(InputStream, ClassLoader)
     */
    public DefaultDeserializerStub(ClassLoader classLoader) {
        this.classLoader = classLoader;
    }

    /**
     * Reads the input stream and deserializes into an object.
     * @see ObjectInputStream#readObject()
     */
    @Override
    public Object deserialize(InputStream inputStream) throws IOException {
        System.out.print("Has come " + Application.incCount());
        ObjectInputStream objectInputStream = new ConfigurableObjectInputStream(inputStream, this.classLoader);
        try {
            System.out.println(" and succesed " + Application.incSuccesed());
            return objectInputStream.readObject();
        }
        catch (ClassNotFoundException ex) {
            throw new NestedIOException("Failed to deserialize object type", ex);
        }
    }

}
