package com.ealen.job;

import com.ealen.task.TaskInterface;
import com.ealen.util.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

/**
 * Created by EalenXie on 2018/6/4 14:29
 * :@DisallowConcurrentExecution : 此标记用在实现Job的类上面,意思是不允许并发执行.
 * :注意org.quartz.threadPool.threadCount线程池中线程的数量至少要多个,否则@DisallowConcurrentExecution不生效
 * :假如Job的设置时间间隔为3秒,但Job执行时间是5秒,设置@DisallowConcurrentExecution以后程序会等任务执行完毕以后再去执行,否则会在3秒时再启用新的线程执行
 */
@DisallowConcurrentExecution
@Component
@Slf4j
public class DynamicJob implements Job {

    @Autowired
    private ApplicationContext ctx;

    /**
     * 核心方法,Quartz Job真正的执行逻辑.
     *
     * @param executorContext executorContext JobExecutionContext中封装有Quartz运行所需要的所有信息
     * @throws JobExecutionException execute()方法只允许抛出JobExecutionException异常
     */
    @Override
    public void execute(JobExecutionContext executorContext) throws JobExecutionException {
        //JobDetail中的JobDataMap是共用的,从getMergedJobDataMap获取的JobDataMap是全新的对象
        JobDataMap map = executorContext.getMergedJobDataMap();
        String jarPath = map.getString("jarPath");
        String parameter = map.getString("parameter");
        String vmParam = map.getString("vmParam");
        String group = map.getString("jobGroup");
        String des = map.getString("jobDescription");
        String name = map.getString("name");
        String className = map.getString("className");
        log.info("Running Job name : {} ", name);
        log.info(String.format("Running Job cron : %s", map.getString("cronExpression")));
        if (!className.trim().equals("")) {
            TaskInterface task = (TaskInterface)ctx.getBean(className);
            task.execute(parameter, new Date(), new Date(), group, name) ;
        }

        long startTime = System.currentTimeMillis();
        if (!StringUtils.isEmpty(jarPath)) {
            excuteJar(jarPath, vmParam, parameter);
        }
        long endTime = System.currentTimeMillis();
        log.info(">>>>>>>>>>>>> Running Job has been completed , cost time : {}ms\n ", (endTime - startTime));
    }

    //记录Job执行内容
    private void logProcess(InputStream inputStream, InputStream errorStream) throws IOException {
        String inputLine;
        String errorLine;
        BufferedReader inputReader = new BufferedReader(new InputStreamReader(inputStream));
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(errorStream));
        while (Objects.nonNull(inputLine = inputReader.readLine())) log.info(inputLine);
        while (Objects.nonNull(errorLine = errorReader.readLine())) log.error(errorLine);
    }

    public void excuteJar(String jarPath, String vmParam, String parameter) {
        File jar = new File(jarPath);
        if (jar.exists()) {
            ProcessBuilder processBuilder = new ProcessBuilder();
            processBuilder.directory(jar.getParentFile());
            List<String> commands = new ArrayList<>();
            commands.add("java");
            if (!StringUtils.isEmpty(vmParam)) commands.add(vmParam);
            commands.add("-jar");
            commands.add(jarPath);
            if (!StringUtils.isEmpty(parameter)) commands.add(parameter);
            processBuilder.command(commands);
            log.info("Running Job details as follows >>>>>>>>>>>>>>>>>>>>: ");
            log.info("Running Job commands : {}  ", StringUtil.getListString(commands));
            try {
                Process process = processBuilder.start();
                logProcess(process.getInputStream(), process.getErrorStream());
            } catch (IOException e) {
                log.error("执行jar包异常：", e);
            }
        } else {
           log.error("Job Jar not found >>  " + jarPath);
        }
    }

}
